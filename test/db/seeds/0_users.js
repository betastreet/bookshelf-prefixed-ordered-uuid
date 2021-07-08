'use strict'

const bookshelf = require('../').bookshelf;

exports.seed = (knex) => {
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
        {
            id: bookshelf.Model.prefixedUuidToBinary('UR11e72f23a23c6f809ff3317dc0baaeca', 2),
            first_name: 'Leon',
            last_name: 'Marten',
            email: 'leon.marten@yahoo.com'
        },
        {
            id: bookshelf.Model.prefixedUuidToBinary('UR11e72f23a23c6f889ff3317dc0baaeca', 2),
            first_name: 'German',
            last_name: 'Smith',
            email: 'g.smith@yahoo.com'
        },
    ];

    return Promise.all([
        knex('users').del(),
        knex('users').insert(users)
    ]);
}
