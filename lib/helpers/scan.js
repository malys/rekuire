"use strict";

var fs = require('fs');
var path = require('path');



//Windows Unix Compatibility
//Replace Slash and backward slash n
function replaceSlash(element) {
    if (element) {
        element = element.replace(/(\/|\\)/g, '@');
        element = element.replace(/@@/g, '@');
    }
    return element.toUpperCase();

}

function replaceForEachSlash(element, index, array) {
    if (element) {
        array[index] = replaceSlash(element);
    }
}
/*
function mergeAttributes(obj1, obj2) {
    var obj3 = {};
    for (var attrname1 in obj1) {
        obj3[attrname1] = obj1[attrname1];
    }
    for (var attrname in obj2) {
        obj3[attrname] = obj2[attrname];
    }
    return obj3;
}*/


module.exports = {
    scanResults: {},
    filesInProject: {},
    ambiguousFileNames: {},
    scanned: false,
    toLaunch: true,
    foldersToIgnore: ['node_modules'],
    customAliases: {},
    rescan: function() {
        this.ambiguousFileNames = {};
        this.filesInProject = this.customAliases;
        this.scanResults = this._scan(this.baseDir, this.extensions);
        this.scanned = true;
        return this.scanResults;
    },
    scan: function(dir, extensions_) {
        if (this.scanned) {
            return this.scanResults;
        } else {
            this.baseDir = dir;
            this.extensions = extensions_;
            return this.rescan();
        }
    },
    setIgnore: function(foldersToIgnore_) {
        this.foldersToIgnore = foldersToIgnore_.concat(['node_modules']);
        this.foldersToIgnore.forEach(replaceForEachSlash);
        this.toLaunch = true;
    },
    setAlias: function(customAliases_) {
        this.customAliases = customAliases_;
        this.toLaunch = true;
    },

    insertPathToIndex: function(alias, realpath) {
        if (this.filesInProject[alias] !== undefined) {
            if (this.ambiguousResolve) {
                var isResolved = this.ambiguousResolve(alias, this.filesInProject[alias], realpath);
                if (isResolved === true) {
                    this.filesInProject[alias] = realpath;
                } else if (isResolved === false) {
                    this.ambiguousFileNames[alias] = alias;
                }
            } else {
                this.ambiguousFileNames[alias] = alias;
            }

        } else {
            this.filesInProject[alias] = realpath;
        }
    },

    shouldScanFurther: function(root, file) {
        // try catch - because statSync can't handle errors based on permissions.
        try {
            return file.substr(0, 1) !== '.' && fs.statSync(root + '/' + file).isDirectory();
        } catch (e) {
            return false;
        }
    },

    shouldIgnore: function(root, file) {
        var relPath = path.relative(this.baseDir, root);
        return (this.foldersToIgnore.indexOf(replaceSlash(relPath)) !== -1);
    },

    _scan: function(dir, extensions) {
        var file, files, filePath, _i, _len;
        files = fs.readdirSync(dir);
        for (_i = 0, _len = files.length; _i < _len; _i++) {
            file = files[_i];
            filePath = path.normalize(dir + '/' + file);


            if (this.shouldIgnore(dir, file)) {
                continue;
            } else if (this.shouldScanFurther(dir, file)) {
                this._scan(filePath, extensions);
            } else {
                var ext = path.extname(file);
                var base = path.basename(file, ext);
                var relative = path.relative(this.baseDir, dir);
                if (~extensions.indexOf(ext)) {

                    // adding the full relative path
                    if (base === 'index') {
                        this.insertPathToIndex(relative, filePath);
                    } else {
                        this.insertPathToIndex(relative + '/' + base, filePath);
                        this.insertPathToIndex(relative + '/' + file, filePath);
                    }

                    // just base
                    this.insertPathToIndex(base, filePath);

                    // base with extension
                    this.insertPathToIndex(file, filePath);
                }
            }
        }

        /**
         * @type {{filesInProject: {}, ambiguousFileNames: {}}}
         */
        this.scanResults = {
            filesInProject: this.filesInProject,
            ambiguousFileNames: this.ambiguousFileNames
        };

        return this.scanResults;
    }

};
