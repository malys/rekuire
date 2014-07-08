'use strict';

// this prevents Rekuire from being cached, so 'parent' is always updated
delete require.cache[require.resolve(__filename)];

var path = require('path'),
	_ = require('underscore'),
	isString = require('./helpers/isString'),
	fs = require('fs'),
	extensions = ['.js'],
	baseDir = path.normalize(process.cwd() + '/'),
	scannerResults, filesInProject, ambiguousFileNames;

var scanner = require('./helpers/scan');
var notModule = false;

module.exports = rekuire;

function scanning() {
	if (scanner.toLaunch || !scannerResults) {
		scannerResults = scanner.scan(baseDir, extensions);
		scanner.toLaunch = false;
		filesInProject = scannerResults.filesInProject;
		ambiguousFileNames = scannerResults.ambiguousFileNames;

	}
}

function getModule(requirement, fromPath) {

	scanning();
	//relative path
	var calleePath = path.dirname(module.parent.filename);
	if (requirement.substring(0, 2) !== './') {
		//Absolute path or alias
		calleePath = path.dirname(module.parent.filename) + '/' + path.relative(path.dirname(module.parent.filename), process.cwd());
	}
	var parentReq = module.parent.require.bind(module);
	var retModule = null;
	var modulePath = null;
	var error = '';

	if (ambiguousFileNames[requirement] !== undefined) {
		throw new Error('Ambiguity Error: There are more then one files that is named ' + requirement);
	}

	if (filesInProject[requirement] !== undefined) {
		// User typed in a relative path

		try {
			if (!fromPath) {
				retModule = parentReq(filesInProject[requirement]);
			}
		} catch (e) {
			// module by that name was not found in the scanner, maybe it's a general node module.
			error += e + '\n';
		}

		modulePath = filesInProject[requirement];
	} else {
		// User typed in a module name
		modulePath = path.normalize(calleePath + '/' + requirement);

		try {
			if (!fromPath) {
				retModule = parentReq(modulePath);
			}
		} catch (e) {
			// module by that name was not found in the scanner, maybe it's a general node module.
			error += e + '\n';
		}
		// General node module
		if (retModule === null && !fromPath) {
			modulePath = requirement;
			try {
				retModule = parentReq(requirement);
			} catch (e) {
				error += e + '\n';
			}
		}
	}

	if (!retModule) {
		var mess = 'Can not find a module by the name of [' + requirement + '] or it has returned empty. nested: ' + error;
		//require not module -> concat file
		if (!notModule) {
			throw new Error(mess);
		}
	}

	return {
		module: retModule,
		path: modulePath
	};
}

function getPath(requirement) {
	scanning();
	var location = getModule(requirement, true).path;
	if (location === undefined) {
		throw 'Could not locate a local for a module named [' + requirement + ']';
	}
	return location;
}

function rekuire(requirement) {
	if (isString(requirement)) {
		return getModule(requirement).module;
	} else {
		return {
			path: getPath
		};
	}
}

rekuire.path = function (requirement) {
	var result = getPath(requirement);
	return result;
};

//Ignored Path
rekuire.ignore = function ( /*args*/ ) {
	var args = Array.prototype.slice.call(arguments);
	scanner.setIgnore(args);
};

//Ignored Path
rekuire.ignoreArray = function (array_) {
	scanner.setIgnore(array_);
};

//Ignored Path
rekuire.importNotModule = function (notModule_) {
	notModule = notModule_;
};

//Declared Alias
rekuire.alias = function (aliases_) {
	if (aliases_) {
		Object.keys(aliases_).forEach(function (key) {
			aliases_[key] = path.resolve(aliases_[key]);
			if (!fs.existsSync(aliases_[key])) {
				throw new Error('Path not found : ' + path.relative(process.cwd(), aliases_[key]));
			}
		});
		scanner.setAlias(aliases_);
	}
};