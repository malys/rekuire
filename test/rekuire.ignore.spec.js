'use strict';


var rek = require('../lib/main');
rek.ignore('test/testResources/out', 'test/testResources/target');

describe('Testing "rekuire"', function () {
    describe('ignoring', function () {
        it('should be able to ignore folders', function () {
            var found = null;
            try {
                found = rek('shouldNotFind');
            } catch (e) {
                found = null;
            }
            expect(found).toBeNull();
        });
    });

});