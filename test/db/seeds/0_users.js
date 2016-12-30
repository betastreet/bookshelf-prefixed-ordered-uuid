'use strict'

const bookshelf = require('../').bookshelf;

exports.seed = (knex, Promise) => {
    let users = [
        {
            id: bookshelf.Model.prefixedUuidToBinary('UR455d7811ee785884b43f693fda7a17e2', 2),
            first_name: 'Amira',
            last_name: 'Dooley',
            email: 'Raina_Kunde14@hotmail.com'
        },
        {
            id: bookshelf.Model.prefixedUuidToBinary('UR45db68b15391690a86e769ff652c6adb', 2),
            first_name: 'Joaquin Leffler',
            last_name: 'Leffler',
            email: 'Brandyn_Collier44@yahoo.com'
        },
        {
            id: bookshelf.Model.prefixedUuidToBinary('UR47e465b473571017a5a27bdedd955cd2', 2),
            first_name: 'Chaim',
            last_name: 'Herman',
            email: 'Emmie.Stehr@yahoo.com'
        },
    ];

    return Promise.join(
        knex('users').del(),
        knex('users').insert(users)
    );
}
