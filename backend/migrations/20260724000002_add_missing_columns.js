exports.up = function (knex) {
  return knex.schema
    .alterTable('centres', (t) => {
      t.string('address', 255).nullable().after('city');
      t.string('phone', 20).nullable().after('address');
    })
    .alterTable('owners', (t) => {
      t.string('phone', 20).nullable().after('email');
    });
};

exports.down = function (knex) {
  return knex.schema
    .alterTable('owners', (t) => {
      t.dropColumn('phone');
    })
    .alterTable('centres', (t) => {
      t.dropColumn('phone');
      t.dropColumn('address');
    });
};
