'use strict';

var rek = require('../lib/main');


describe('Testing "rekuire"', function () {

    describe('alias', function () {
        it('should be detected', function () {
            rek.alias({
                'testMod': 'test/testResources/nestedPackage/folder1/SameNamedModule.js',
            });
            var imported = rek('testMod');
            expect(imported).toBe('SameNamedModule');
        });

        it('should be existed', function () {
            var result = false;
            try {
                rek.alias({
                    'testModX': 'test/testResources/nestedPackage/folderx/SameNamedModule.js'
                });
                rek('testModX');
            } catch (err) {
                result = true;
            }
            expect(result).toBe(true);

        });

        it('should be not detect ignored list', function () {
            var found = null;
            try {
                found = rek('testMod');
            } catch (e) {
                found = null;
            }
            expect(found).not.toBeNull();

        });

        it('should have an extension', function () {
            var result = false;
            try {
                rek.alias({
                    'testModExt': 'test/testResources/nestedPackage/folder1/SameNamedModule'
                });

                rek('testModExt');
            } catch (err) {
                result = true;
            }
            expect(result).toBe(true);

        });
    });


});