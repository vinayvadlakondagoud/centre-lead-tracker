/**
 * Centre Lead Tracker — Status Audit Log
 * Tracks every status change on a lead with old/new values and reason.
 */

exports.up = function (knex) {
  return knex.schema.createTable('status_audit_logs', (t) => {
    t.increments('id').primary();
    t.integer('lead_id').unsigned().notNullable();
    t.foreign('lead_id').references('id').inTable('leads');
    t.string('old_status', 50).nullable();
    t.string('new_status', 50).notNullable();
    t.string('changed_by', 150).nullable();
    t.text('reason').nullable();
    t.timestamps(true, true);

    t.index('lead_id');
    t.index('new_status');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('status_audit_logs');
};
