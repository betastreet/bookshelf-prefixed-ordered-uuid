'use strict'

const OrderedUUID = require('ordered-uuid');

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
        if (uuid === null || uuid === undefined) {
            return null;
        }
        if (Buffer.isBuffer(uuid) && uuid.length === 16 + orderedUuidPrefixLength) {
            return uuid;
        }
        if ((Buffer.isBuffer(uuid) && uuid.length !== 16)
          || (!Buffer.isBuffer(uuid) && !/^[A-Z-]{2}[a-z0-9]{32}$/.test(uuid))) {
            throw new Error('Invalid UUID to convert: ' + uuid);
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
        if (typeof(buff) === 'string' && buff.length === 32 + orderedUuidPrefixLength) {
            return buff;
        } else if (!Buffer.isBuffer(buff) || buff.length !== 16 + (orderedUuidPrefixLength || 2)) {
            throw new Error('Invalid binary UUID to convert: ' + buff);
        }
        try {
            if (orderedUuidPrefixLength) {
                const prefix = buff.slice(0, orderedUuidPrefixLength || 2);
                const uid = buff.slice(orderedUuidPrefixLength || 2);
                return prefix.toString() + uid.toString('hex');
            }
            return buff.toString('hex');
        } catch (err) {
            throw new Error('Invalid binary UUID to convert.' + buff);
        }
    };

    bookshelf.Model.prefixedUuidRegex = function (orderedUuidPrefix) {
        return new RegExp('^' + (orderedUuidPrefix || '') + '[a-z0-9]{32}$');
    };

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

        writeDefaults: function (model, attrs, options) {
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
            if (attrs && typeof attrs === 'object') {
                Object.keys(this.orderedUuids).forEach((column) => {
                    if (Object.hasOwnProperty.bind(attrs)(column)) {
                        attrs[column] = bookshelf.Model.prefixedUuidToBinary(attrs[column],
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
            collection.forEach(function (model) {
                model.readDefaults();
            });
        },

        writeCollectionDefaults: function (collection, columns, options) {
            // hackey work-around to modify the knex statement's where clauses to the applicable converted values
            options = this.mapKnexQuery(options, function (obj, stmt) {
                if (!Buffer.isBuffer(stmt.value)) {
                    Object.keys(obj.orderedUuids).forEach((column) => {
                        if (Array.isArray(stmt.value) && (stmt.column === `${obj.tableName}.${column}` || stmt.column === column)) {
                            const stmtValues = [];
                            stmt.value.forEach((stmtValue) => {
                                if (stmtValue && !Buffer.isBuffer(stmtValue)) {
                                    const generatedId = bookshelf.Model.prefixedUuidToBinary(stmtValue,
                                        (obj.orderedUuids[column] ? obj.orderedUuids[column].length : null));
                                    stmtValues.push(generatedId);
                                } else if (stmtValue) {
                                    stmtValues.push(stmtValue);
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
