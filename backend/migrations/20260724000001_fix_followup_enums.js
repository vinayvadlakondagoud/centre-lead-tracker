/**
 * Migration: Align followup channel and outcome ENUMs across all layers.
 *
 * Strategy (MySQL ENUM limitation):
 *   1. Expand ENUM to include both old and new values
 *   2. Update data from old values to new values
 *   3. Tighten ENUM to only the final desired values
 */

exports.up = function (knex) {
  // Step 1: Expand channel ENUM to include all values (old + new)
  return knex.schema.raw(`
    ALTER TABLE followups
    MODIFY COLUMN channel ENUM(
      'Phone', 'WhatsApp', 'Email', 'In-Person', 'Walk-in', 'SMS', 'Other'
    ) NOT NULL
  `)
  // Step 2: Expand outcome ENUM to include all values (old + new)
  .then(() => knex.schema.raw(`
    ALTER TABLE followups
    MODIFY COLUMN outcome ENUM(
      'Reached', 'No Answer', 'No Response', 'Busy', 'Voicemail',
      'Interested', 'Not Interested', 'Rescheduled',
      'Callback Scheduled', 'Converted'
    ) NOT NULL
  `))
  // Step 3: Migrate data — normalize old values to new values
  .then(() => knex('followups').where('outcome', 'No Answer').update({ outcome: 'No Response' }))
  // Step 4: Tighten outcome ENUM to final set (drop 'No Answer')
  .then(() => knex.schema.raw(`
    ALTER TABLE followups
    MODIFY COLUMN outcome ENUM(
      'Reached', 'No Response', 'Busy', 'Voicemail',
      'Interested', 'Not Interested', 'Rescheduled',
      'Callback Scheduled', 'Converted'
    ) NOT NULL
  `));
};

exports.down = function (knex) {
  // Reverse: expand → migrate back → tighten
  return knex.schema.raw(`
    ALTER TABLE followups
    MODIFY COLUMN outcome ENUM(
      'Reached', 'No Response', 'No Answer', 'Busy', 'Voicemail',
      'Interested', 'Not Interested', 'Rescheduled',
      'Callback Scheduled', 'Converted'
    ) NOT NULL
  `)
  .then(() => knex('followups').where('outcome', 'No Response').update({ outcome: 'No Answer' }))
  .then(() => knex.schema.raw(`
    ALTER TABLE followups
    MODIFY COLUMN channel ENUM(
      'Phone', 'Email', 'WhatsApp', 'In-Person', 'SMS'
    ) NOT NULL
  `))
  .then(() => knex.schema.raw(`
    ALTER TABLE followups
    MODIFY COLUMN outcome ENUM(
      'Reached', 'No Answer', 'Busy', 'Voicemail',
      'Interested', 'Not Interested', 'Rescheduled'
    ) NOT NULL
  `));
};
