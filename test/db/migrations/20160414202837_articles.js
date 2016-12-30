'use strict'

exports.up = (knex) => knex.schema.createTable('articles', (table) => {
    table.binary('id', 18).primary();
    table.binary('user_id', 18).notNullable().references('users.id');
    table.string('title');
    table.string('body');
    table.timestamps();
})

exports.down = (knex) => knex.schema.dropTable('articles');
