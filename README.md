# bookshelf-prefixed-ordered-uuid
[![Version](https://badge.fury.io/js/bookshelf-prefixed-ordered-uuid.svg)](http://badge.fury.io/js/bookshelf-prefixed-ordered-uuid)
[![Code Climate](https://codeclimate.com/github/paulleduc/bookshelf-prefixed-ordered-uuid/badges/gpa.svg)](https://codeclimate.com/github/paulleduc/bookshelf-prefixed-ordered-uuid)
[![Build Status](https://travis-ci.org/paulleduc/bookshelf-prefixed-ordered-uuid.svg?branch=main)](https://travis-ci.org/paulleduc/bookshelf-prefixed-ordered-uuid)
[![Test Coverage](https://codeclimate.com/github/paulleduc/bookshelf-prefixed-ordered-uuid/badges/coverage.svg)](https://codeclimate.com/github/paulleduc/bookshelf-prefixed-ordered-uuid/coverage)
[![Downloads](http://img.shields.io/npm/dm/bookshelf-prefixed-ordered-uuid.svg)](https://www.npmjs.com/package/bookshelf-prefixed-ordered-uuid)

Increase database performance by supporting ordered UUID's for your Bookshelf models. The prefix helps you identify the type of resource associated with its ID.

### Installation

After installing `bookshelf-prefixed-ordered-uuid` with `npm i --save bookshelf-prefixed-ordered-uuid`,
add it as a bookshelf plugin and enable it on your models.

```javascript
let knex = require('knex')(require('./knexfile.js').development);
let bookshelf = require('bookshelf')(knex);

// Add the plugin
bookshelf.plugin(require('bookshelf-prefixed-ordered-uuid'));

// Enable it on your models
let User = bookshelf.Model.extend({
    tableName: 'users',
    orderedUuids: {
        id: 'UR', // you can specify multiple columns (great for relationship UUID's). Give a null value to use no prefix.
    },
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

## Useful Methods

```javascript
// returns a prefixed UUID
let uuid = bookshelf.Model.generateUuid('BO');

// returns a regex for validating prefixed UUID's
let regex = bookshelf.Model.prefixedUuidRegex('UR');

// converts a prefixed UUID into binary
let uuidBinary = bookshelf.Model.prefixedUuidToBinary(uuid, 2);

// converts a prefixed UUID binary into a string
let uuidBinary = bookshelf.Model.binaryToPrefixedUuid(uuidBinary, 2);
```

### MySQL Functions

Here are some custom MySQL functions for generating and converting Prefixed Ordered UUID's (these are built for prefix lengths of 2):

```sql
DELIMITER //
CREATE DEFINER=`user`@`localhost` FUNCTION `POUUID`(prefix CHAR(2), uuid BINARY(36))
RETURNS BINARY(18) DETERMINISTIC
RETURN CONCAT(CONVERT(prefix, BINARY), UNHEX(CONCAT(SUBSTR(uuid, 15, 4),SUBSTR(uuid, 10, 4),SUBSTR(uuid, 1, 8),SUBSTR(uuid, 20, 4),SUBSTR(uuid, 25))));
//
DELIMITER ;

DELIMITER //
CREATE DEFINER=`user`@`localhost` FUNCTION `FROM_POUUID`(pouuid BINARY(18))
RETURNS CHAR(38) DETERMINISTIC
RETURN CONCAT(SUBSTR(pouuid, 1, 2), LOWER(HEX(SUBSTR(pouuid, 3))));
//
DELIMITER ;

DELIMITER //
CREATE DEFINER=`user`@`localhost` FUNCTION `TO_POUUID`(pouuid CHAR(38))
RETURNS BINARY(18) DETERMINISTIC
RETURN CONCAT(SUBSTR(pouuid, 1, 2), UNHEX(SUBSTR(pouuid, 3)));
//
DELIMITER ;
```

## MySQL Function Usage

Generate new Prefixed Ordered UUID binary:

```sql
INSERT INTO users (id, name) VALUES (POUUID('UR', uuid()), 'Bim Jimbo');
```

Convert Prefixed Ordered UUID binary to string:

```sql
SELECT FROM_POUUID(id) FROM users;
```

Convert Prefixed Ordered UUID string to binary:

```sql
SELECT * FROM users WHERE id = TO_POUUID("UR407cbd87e831746980ac705c6e7e176c");
```
