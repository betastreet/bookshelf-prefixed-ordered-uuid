# bookshelf-prefixed-ordered-uuid
[![Version](https://badge.fury.io/js/bookshelf-prefixed-ordered-uuid.svg)](http://badge.fury.io/js/bookshelf-prefixed-ordered-uuid)
[![Downloads](http://img.shields.io/npm/dm/bookshelf-prefixed-ordered-uuid.svg)](https://www.npmjs.com/package/bookshelf-prefixed-ordered-uuid)

Increase database performance by supporting ordered UUID's prefixed with a string as the primary key for your Bookshelf models. The prefix helps you identify the type of resource associated with its ID.

### Installation

After installing `bookshelf-prefixed-ordered-uuid` with `npm i --save bookshelf-prefixed-ordered-uuid`,
add it as a bookshelf plugin and enable it on your models.
The field used as the UUID is `id`.

```javascript
let knex = require('knex')(require('./knexfile.js').development);
let bookshelf = require('bookshelf')(knex);

// Add the plugin
bookshelf.plugin(require('bookshelf-prefixed-ordered-uuid'));

// Enable it on your models
let User = bookshelf.Model.extend({
    tableName: 'users',
    orderedUuids: ['id'],    // you can specify multiple columns (great for relationship UUID's)
    orderedUuidPrefix: 'UR', // optional, defaults to no prefix
});
```

### Usage

You can call every method as usual and `bookshelf-prefixed-ordered-uuid` will handle the conversion of ID's from/to UUID strings to/from binary format for the database.
Note that when creating your database tables your primary keys should be of type BINARY(16) for no prefix, adding to the length depending on the length of prefix
you intend on using. BINARY(18) works for two letter prefixes.

```javascript
// create a bookshelf model instance and record it to database, the ID will be recorded as binary
new User({ name: 'Sally', email: 'sally@example.com' })
    .save()
    .then(function(user) {
        // produces something like this (note the ID is always fetched in string format, but written as binary in the database):
        // {
        //     "id": "UR470300d5a23108cbba1a410d65dd05ff",
        //     "name": "Sally",
        //     "email": "sally@example.com",
        // },
    });

// now read the user from database
new User({ id: "UR470300d5a23108cbba1a410d65dd05ff" })
        .fetch()
        .then(function(user) {
            // produces:
            // {
            //     "id": "UR470300d5a23108cbba1a410d65dd05ff",
            //     "name": "Sally",
            //     "email": "sally@example.com",
            // },
        });
```
