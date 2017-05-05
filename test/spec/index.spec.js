'use strict'

const bookshelf = require('../db').bookshelf;
const User = require('../db/models/user');
const Article = require('../db/models/article');

describe('helper methods', () => {

    // prefixedUuidRegex
    it('should be a regex that matches valid POUUIDs', () => {
        let regex = bookshelf.Model.prefixedUuidRegex('UR');
        expect('UR455d7811ee785884b43f693fda7a17e2').toMatch(regex);

        regex = bookshelf.Model.prefixedUuidRegex('LONGPREFIX');
        expect('LONGPREFIX45db68b15391690a86e769ff652c6adb').toMatch(regex);

        regex = bookshelf.Model.prefixedUuidRegex();
        expect('47e465b473571017a5a27bdedd955cd2').toMatch(regex);
    });

    it('should be a regex that does not match invalid POUUIDs', () => {
        let regex = bookshelf.Model.prefixedUuidRegex('UR');
        expect(regex.test('AR455d7811ee785884b43f693fda7a17e2')).toBe(false);

        regex = bookshelf.Model.prefixedUuidRegex();
        expect(regex.test('AR455d7811ee785884b43f693fda7a17e2')).toBe(false);

        regex = bookshelf.Model.prefixedUuidRegex('AR');
        expect(regex.test('AR')).toBe(false);
        expect(regex.test('AR455d7811ee78588')).toBe(false);
        expect(regex.test('AR455d7811ee785884b43f693fda7a17e21')).toBe(false);
    });

    // generateUuid
    it('should be a valid POUUID', () => {
        let regex = bookshelf.Model.prefixedUuidRegex('UR');
        expect(bookshelf.Model.generateUuid('UR')).toMatch(regex);

        regex = bookshelf.Model.prefixedUuidRegex('LONGPREFIX');
        expect(bookshelf.Model.generateUuid('LONGPREFIX')).toMatch(regex);

        regex = bookshelf.Model.prefixedUuidRegex();
        expect(bookshelf.Model.generateUuid()).toMatch(regex);
    });

    // prefixedUuidToBinary, binaryToPrefixedUuid
    it('should be a valid POUUID binary and string', () => {
        let regex = bookshelf.Model.prefixedUuidRegex('UR');
        let pouuid = bookshelf.Model.generateUuid('UR');
        let pouuidBinary = bookshelf.Model.prefixedUuidToBinary(pouuid, 2);
        expect(pouuidBinary).toBeInstanceOf(Buffer);
        expect(pouuidBinary.length).toBe(18);
        expect(bookshelf.Model.binaryToPrefixedUuid(pouuidBinary, 2)).toMatch(regex);
    });

});

describe('database querying', () => {

    let userRegex = bookshelf.Model.prefixedUuidRegex('UR');
    let articleRegex = bookshelf.Model.prefixedUuidRegex('AR');

    // instance prefixedUuidRegex
    it('should be a user-instance regex that matches its POUUID ID', (done) => {
        User.fetchAll().then((models) => {
            let regex = models.at(0).prefixedUuidRegex('id');
            let regex2 = models.at(0).prefixedUuidRegex();
            expect(regex).toEqual(userRegex);
            expect(regex).toEqual(regex2);
            expect(models.at(0).get('id')).toMatch(regex);
            done();
        });
    });

    // isNew
    it('should be an existing user instance', (done) => {
        User.fetchAll().then((models) => {
            expect(models.at(0).isNew()).toBe(false);
            done();
        });
    });

    it('should be a new user instance', () => {
        let usr = new User({ first_name: 'Bim', last_name: 'Jimbo' });
        expect(usr.isNew()).toBe(true);
    });

    // get users
    it('should be a user with a valid POUUID ID', (done) => {
        User.fetchAll().then((models) => {
            const jsonModels = models.toJSON();
            expect(jsonModels[0].id).toBeDefined();
            expect(jsonModels[0].id).toMatch(userRegex);
            done();
        });
    });

    // get articles
    it('should be an article with valid POUUID IDs', (done) => {
        Article.fetchAll().then((models) => {
            const jsonModels = models.toJSON();
            expect(jsonModels[0].id).toBeDefined();
            expect(jsonModels[0].id).toMatch(articleRegex);
            expect(jsonModels[0].user_id).toBeDefined();
            expect(jsonModels[0].user_id).toMatch(userRegex);
            done();
        });
    });

    // get user articles
    it('should be a user\'s article with valid POUUID IDs (eager load)', (done) => {
        User.fetchAll({ withRelated: ['articles'] }).then((models) => {
            const jsonModels = models.toJSON();
            expect(jsonModels[0].articles[0].id).toBeDefined();
            expect(jsonModels[0].articles[0].id).toMatch(articleRegex);
            expect(jsonModels[0].articles[0].user_id).toBeDefined();
            expect(jsonModels[0].articles[0].user_id).toMatch(userRegex);
            done();
        });
    });

    // get user articles
    it('should not be duplicates in fetch', (done) => {
        User.fetchAll({ withRelated: ['articles'] }).then((models) => {
            const jsonModels = models.toJSON();
            jsonModels.reduce((acc, cur) => {
                const key = cur.id.toString('hex');
                if (key in acc) {
                    throw `Duplicate found ${key}`;
                }
                acc[key] = cur;
                return acc;
            }, {});
            done();
        });
    });
});
