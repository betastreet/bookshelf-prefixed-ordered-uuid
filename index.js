'use strict'

const OrderedUUID = require('ordered-uuid');
const collection = require('./collection.js');

/**
 * A function that can be used as a plugin for bookshelf
 * @param {Object} bookshelf The main bookshelf instance
 */
module.exports = (bookshelf) => {
    const modelPrototype = bookshelf.Model.prototype;

    // "Static" methods
    bookshelf.Model.generateUuid = function (orderedUuidPrefix) {
        return (orderedUuidPrefix || '') + OrderedUUID.generate();
    };

    bookshelf.Model.prefixedUuidToBinary = function (uuid, orderedUuidPrefixLength) {
        if (uuid === null) {
            return null;
        }
        try {
            if (orderedUuidPrefixLength) {
                const prefix = uuid.substring(0, orderedUuidPrefixLength || 2);
                const uid = uuid.substring(orderedUuidPrefixLength || 2);
                return Buffer.concat([new Buffer(prefix.toString('binary'), 'binary'), new Buffer(uid, 'hex')]);
            }
            return new Buffer(uuid, 'hex');
        } catch (err) {
            throw new Error('Invalid UUID to convert: ' + uuid);
        }
    };

    bookshelf.Model.binaryToPrefixedUuid = function (buff, orderedUuidPrefixLength) {
        try {
            if (orderedUuidPrefixLength) {
                const prefix = buff.slice(0, orderedUuidPrefixLength || 2);
                const uid = buff.slice(orderedUuidPrefixLength || 2);
                return prefix.toString() + uid.toString('hex');
            }
            return buff.toString('hex');
        } catch (err) {
            throw new Error('Invalid binary UUID to convert.');
        }
    };

    bookshelf.Model.prefixedUuidRegex = function (orderedUuidPrefix) {
        return new RegExp('^' + (orderedUuidPrefix || '') + '[a-z0-9]{32}$');
    };

    bookshelf.Collection.prototype._reset = collection.prototype._reset;

    bookshelf.Collection.prototype.set = collection.prototype.set;

    bookshelf.Collection.prototype.remove = collection.prototype.remove;

    bookshelf.Collection.prototype.get = collection.prototype.get;

    // Extends the default model class
    bookshelf.Model = bookshelf.Model.extend({

        initialize: function () {
            modelPrototype.initialize.call(this);

            if (this.orderedUuids && typeof this.orderedUuids === 'object') {
                this.isNewOverride = !this.attributes[this.idAttribute];
                this.on('saving', this.writeDefaults);
                this.on('fetching', this.writeDefaults);
                this.on('destroying', this.writeDefaults);
                this.on('saved', this.readDefaults);
                this.on('fetched', this.readDefaults);
                this.on('destroyed', this.readDefaults);
                this.on('fetched:collection', this.readCollectionDefaults);
                this.on('fetching:collection', this.writeCollectionDefaults);
            }
        },

        // override isNew so that we don't break other plugins that use the method because
        // we set ID regardless of whether the instance is new or not.
        isNew: function () {
            if (this.orderedUuids) {
                return this.isNewOverride;
            }
            return !this.attributes[this.idAttribute];
        },

        writeDefaults: function (model, columns, options) {
            Object.keys(this.orderedUuids).forEach((column) => {
                if (!this.attributes[column] && column === this.idAttribute) this.set(column, bookshelf.Model.generateUuid(this.orderedUuids[column]));
                if (this.attributes[column]) this.set(column, bookshelf.Model.prefixedUuidToBinary(this.attributes[column], (this.orderedUuids[column] ? this.orderedUuids[column].length : null)));
            });
            // hackey work-around to modify the knex statement's where clauses to the applicable converted values
            this.mapKnexQuery(options, function (obj, stmt) {
                Object.keys(obj.orderedUuids).forEach((column) => {
                    if (!Buffer.isBuffer(stmt.value)
                        && (!Array.isArray(stmt.value) || !Buffer.isBuffer(stmt.value[0]))
                        && (stmt.column === `${obj.tableName}.${column}` || stmt.column === column)
                        && stmt.value) {
                        stmt.value = bookshelf.Model.prefixedUuidToBinary(stmt.value,
                            (obj.orderedUuids[column] ? obj.orderedUuids[column].length : null));
                    }
                });
                return stmt;
            });
            // this switches update fields with the applicable converted values
            if (columns && typeof columns === 'object') {
                Object.keys(this.orderedUuids).forEach((column) => {
                    if (columns.hasOwnProperty(column)) {
                        columns[column] = bookshelf.Model.prefixedUuidToBinary(columns[column],
                            (this.orderedUuids[column] ? this.orderedUuids[column].length : null));
                    }
                });
            }
            return this;
        },

        readDefaults: function () {
            Object.keys(this.orderedUuids).forEach((column) => {
                if (this.attributes[column]) this.set(column, bookshelf.Model.binaryToPrefixedUuid(this.attributes[column], (this.orderedUuids[column] ? this.orderedUuids[column].length : null)));
            });
        },

        readCollectionDefaults: function (collection) {
            collection.each(function (model) {
                model.readDefaults();
            });
        },

        writeCollectionDefaults: function (collection, columns, options) {
            // hackey work-around to modify the knex statement's where clauses to the applicable converted values
            options = this.mapKnexQuery(options, function (obj, stmt) {
                if (!Buffer.isBuffer(stmt.value)) {
                    Object.keys(obj.orderedUuids).forEach((column) => {
                        if (Array.isArray(stmt.value)) {
                            const stmtValues = [];
                            stmt.value.forEach((stmtValue) => {
                                if ((stmt.column === `${obj.tableName}.${column}` || stmt.column === column) && stmtValue) {
                                    const generatedId = bookshelf.Model.prefixedUuidToBinary(stmtValue,
                                        (obj.orderedUuids[column] ? obj.orderedUuids[column].length : null));
                                    stmtValues.push(generatedId);
                                }
                            });
                            stmt.value = stmtValues;
                        } else if ((stmt.column === `${obj.tableName}.${column}` || stmt.column === column) && stmt.value) {
                            stmt.value = bookshelf.Model.prefixedUuidToBinary(stmt.value,
                                (obj.orderedUuids[column] ? obj.orderedUuids[column].length : null));
                        }
                    });
                }
                return stmt;
            });
        },

        mapKnexQuery: function (knexQuery, callback) {
            if (this.orderedUuids
                && knexQuery
                && knexQuery.query
                && knexQuery.query._statements
                && knexQuery.query._statements.length) {
                knexQuery.query._statements = knexQuery.query._statements.map(function (stmt) {
                    return callback(this, stmt);
                }, this);
            }
            return knexQuery;
        },

        prefixedUuidRegex: function (attribute) {
            if (!attribute && this.orderedUuids[this.idAttribute]) attribute = this.idAttribute;
            return new RegExp('^' + (this.orderedUuids[attribute] || '') + '[a-z0-9]{32}$');
        }
    });
};
