'use strict'

const bookshelf = require('../').bookshelf;

exports.seed = (knex, Promise) => {
    let articles = [
        {
            id: bookshelf.Model.prefixedUuidToBinary(bookshelf.Model.generateUuid('AR'), 2),
            user_id: bookshelf.Model.prefixedUuidToBinary('UR455d7811ee785884b43f693fda7a17e2', 2),
            title: 'Payment PNG Cuban Peso Peso Convertible',
            body: 'IB silver synergistic clicks-and-mortar Pennsylvania action-items web-readiness Saudi Arabia Gorgeous Fresh Pizza holistic',
        },
        {
            id: bookshelf.Model.prefixedUuidToBinary(bookshelf.Model.generateUuid('AR'), 2),
            user_id: bookshelf.Model.prefixedUuidToBinary('UR45db68b15391690a86e769ff652c6adb', 2),
            title: 'Needs-based intuitive',
            body: 'Generic Plastic Pants Nebraska Fresh Som Pataca override quantify COM Keyboard pixel',
        },
        {
            id: bookshelf.Model.prefixedUuidToBinary(bookshelf.Model.generateUuid('AR'), 2),
            user_id: bookshelf.Model.prefixedUuidToBinary('UR47e465b473571017a5a27bdedd955cd2', 2),
            title: 'Firewall Investor Iowa',
            body: 'Intelligent Frozen Keyboard Industrial yellow Auto Loan Account transmit red HDD Upgradable Electronics Unbranded',
        }
    ];

    return Promise.join(
        knex('articles').del(),
        knex('articles').insert(articles)
    );
}
