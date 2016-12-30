'use strict'

let db = require('../')

module.exports = db.bookshelf.model('Article', {
    tableName: 'articles',
    orderedUuids: {
        id: 'AR',
        user_id: 'UR',
    },

    user: function () {
        return this.belongsToOne('User');
    },
})
