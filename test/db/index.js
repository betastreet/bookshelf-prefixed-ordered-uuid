'use strict'

let fs = require('fs')
let config = require('./knexfile')
let knex = require('knex')(config.development)
let bookshelf = require('bookshelf')(knex)

// Install all necessary plugins
bookshelf.plugin('registry')
bookshelf.plugin(require('../../'))

module.exports = {
    knex,
    bookshelf,
}

// Load all models
fs.readdirSync(`${__dirname}/models`)
    .forEach((model) => require(`${__dirname}/models/${model}`))
