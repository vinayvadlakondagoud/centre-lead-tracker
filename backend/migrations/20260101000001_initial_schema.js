/**
 * Centre Lead Tracker — Initial Schema
 * MySQL migration creating all required tables.
 */

exports.up = function (knex) {
  return knex.schema
    // ── Centres ──────────────────────────────────────────────────────
    .createTable('centres', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable().unique();
      t.string('city', 100).notNullable();
      t.timestamps(true, true);
    })

    // ── Owners (sales/ops team) ──────────────────────────────────────
    .createTable('owners', (t) => {
      t.increments('id').primary();
      t.string('name', 150).notNullable();
      t.string('email', 150).notNullable().unique();
      t.boolean('is_admin').defaultTo(false);
      t.timestamps(true, true);
    })

    // ── Leads ────────────────────────────────────────────────────────
    .createTable('leads', (t) => {
      t.increments('id').primary();

      // Contact info
      t.string('parent_name', 200).notNullable();
      t.string('child_name', 200).notNullable();
      t.integer('child_age').notNullable();
      t.string('phone', 20).notNullable();
      t.string('phone_normalized', 15).notNullable(); // last 10 digits, used for duplicate check
      t.string('email', 200).notNullable();

      // Centre & ownership
      t.integer('centre_id').unsigned().notNullable();
      t.foreign('centre_id').references('id').inTable('centres');
      t.string('source', 100).notNullable(); // Walk-in, Website, Referral, Social Media, etc.
      t.integer('owner_id').unsigned().notNullable();
      t.foreign('owner_id').references('id').inTable('owners');

      // Status tracking
      t.enum('status', [
        'New',
        'Contacted',
        'Demo Scheduled',
        'Demo Completed',
        'Converted',
        'Lost',
      ]).notNullable().defaultTo('New');

      t.datetime('next_followup_at').nullable();
      t.text('notes').nullable();

      // Soft delete (candidate rule: last digit 0-2)
      t.boolean('is_archived').defaultTo(false);
      t.datetime('archived_at').nullable();

      t.timestamps(true, true);

      // Indexes
      t.index('phone_normalized');
      t.index('status');
      t.index('centre_id');
      t.index('owner_id');
      t.index('is_archived');
      t.index('next_followup_at');
      t.index(['is_archived', 'status']);
    })

    // ── Follow-ups ───────────────────────────────────────────────────
    .createTable('followups', (t) => {
      t.increments('id').primary();
      t.integer('lead_id').unsigned().notNullable();
      t.foreign('lead_id').references('id').inTable('leads').onDelete('CASCADE');

      t.datetime('followed_up_at').notNullable();
      t.enum('channel', [
        'Phone',
        'Email',
        'WhatsApp',
        'In-Person',
        'SMS',
      ]).notNullable();
      t.enum('outcome', [
        'Reached',
        'No Answer',
        'Busy',
        'Voicemail',
        'Interested',
        'Not Interested',
        'Rescheduled',
      ]).notNullable();
      t.text('notes').nullable();
      t.datetime('next_followup_at').nullable();

      t.timestamps(true, true);

      t.index('lead_id');
      t.index('followed_up_at');
    })

    // ── Audit log for archive/restore actions (soft delete rule) ──────
    .createTable('archive_logs', (t) => {
      t.increments('id').primary();
      t.integer('lead_id').unsigned().notNullable();
      t.foreign('lead_id').references('id').inTable('leads');
      t.enum('action', ['archived', 'restored']).notNullable();
      t.string('performed_by', 150).nullable();
      t.text('reason').nullable();
      t.timestamps(true, true);

      t.index('lead_id');
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('archive_logs')
    .dropTableIfExists('followups')
    .dropTableIfExists('leads')
    .dropTableIfExists('owners')
    .dropTableIfExists('centres');
};
