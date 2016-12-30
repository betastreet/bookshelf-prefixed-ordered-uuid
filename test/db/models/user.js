'use strict'

let db = require('../')

module.exports = db.bookshelf.model('User', {
    tableName: 'users',
    orderedUuids: {
        id: 'UR',
    },

    articles: function () {
        return this.hasMany('Article');
    },
})
