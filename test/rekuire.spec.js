'use strict';

var path = require('path'),
    proxyquire = require('proxyquire');

var rek = require('../lib/main');

describe('Testing "rekuire"', function () {
    describe('when running', function () {
        it('should retrieve it according to the file name', function () {

            var imported = rek('someModule.js');
            expect(imported).toBe('some module');
        });

        it('should retrieve it according to the relative path within the project', function () {
            var imported = rek('test/testResources/nestedPackage/someModule.js');
            expect(imported).toBe('some module');
        });

        it('should distinct among file type', function () {

            var error;
            var sameNameJs = rek('sameName.js');
            var sameNameJson = rek('sameName.json');
            var sameNameCoffee = rek('sameName.coffee');
            try {
                rek('sameName'); // should return ambiguity error
            } catch (e) {
                error = e;
            }

            expect(sameNameJs).toEqual('sameName.js');
            expect(sameNameCoffee).toEqual('sameName.coffee');
            expect(sameNameJson).toEqual({
                'name': 'same'
            });
            expect(error).not.toBeNull();
        });

        it('should retrieve it according to the file name (*.json)', function () {

            var imported = rek('someJsonObject.json');
            expect(imported).toEqual({
                'someKey': 'someValue'
            });
        });

        it('should retrieve it according to the file name (*.coffee)', function () {

            var withExt = rek('cup.coffee');
            var withoutExt = rek('cup');
            expect(withExt).toEqual('cup of coffee');
            expect(withExt).toEqual(withoutExt);
        });

        it('should get module by name even if extension not present', function () {

            var jsModule = rek('someModule');
            var jsonObject = rek('someJsonObject');

            expect(jsModule).toBe('some module');
            expect(jsonObject).toEqual({
                'someKey': 'someValue'
            });
        });

        it('should retrieve it according to relative path', function () {

            var imported = rek('./testResources/nestedPackage/someModule.js');
            expect(imported).toBe('some module');
        });

        it('should retrieve module from node_modules', function () {

            var fse = rek('fs-extra');
            expect(fse).not.toBeNull();
        });

        it('should retrieved node framework modules', function () {

            var fse = rek('fs');
            expect(fse).not.toBeNull();
        });

        it('should throw an error if not found', function () {

            var error = null;
            try {
                rek('no-such-package');
            } catch (e) {
                error = e;
            }
            expect(error).not.toBeNull();
        });
    });

    describe('when rekuiring a name that matches two files in the system', function () {
        it('should throw an error', function () {

            var error = null;
            try {
                rek('SameNamedModule');
            } catch (e) {
                error = e;
            }
            expect(error).not.toBeNull();
        });
    });

    describe('when rekuiring just the local path', function () {
        it('should return the right path', function () {

            var localPath = path.relative(__dirname, rek().path('someModule.js'));
            expect(localPath).toEqual(path.normalize('testResources/nestedPackage/someModule.js'));
        });

        it('should return the right path without the use of parentheses', function () {

            var rekPath = rek.path('someModule.js');
            var localPath = path.relative(__dirname, rekPath);
            expect(localPath).toEqual(path.normalize('testResources/nestedPackage/someModule.js'));
        });

        it('should return just the module name if its a global module', function () {

            var rekPath = rek.path('fs-extra');
            expect(rekPath).toEqual('fs-extra');
        });

        it('should throw an error if couldn\'t find', function () {

            var error = null;
            try {
                rek().path('no-such-package');
            } catch (e) {
                error = e;
            }


            expect(error).not.toBeNull();
        });

    });

    describe('when used with proxyrequire', function () {
        it('should be able rekuires to be replaced', function () {

            var fakeFs = {
                this_module: 'is fake'
            };
            var ModuleToBeProxied = proxyquire(rek().path('ModuleToBeProxied'), {
                fs: fakeFs
            });
            var instance = new ModuleToBeProxied();
            expect(instance.getFs()).toBe(fakeFs);
        });
    });

    describe('when rekuiring a folder path with index.js in it', function () {
        it('should return the index file', function () {

            var imported = rek('test/testResources/nestedPackage/folderWithIndex');
            expect(imported).toBe('index file content');
        });
    });

    describe('when two packages are using Rekuire, one is nested inside the other', function () {
        it('should each rekuire modules from the package scope', function () {
            var pc = require('./helpers/package-creator.js');
            pc.createNamePackage();
            pc.createParentPackage();
            pc.createChildPackage();

            var parent = rek('parent-package');
            expect(rek('name')).toEqual('root');
            expect(parent.rekuireName()).toEqual('parent-package');
            expect(parent.childRekuireName()).toEqual('child-package');
            pc.cleanTestPackages();
        });
    });
});