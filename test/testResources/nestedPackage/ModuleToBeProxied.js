"use strict";

var rek = require('../../../lib/main');
var fs = rek('fs');
module.exports = ModuleToBeExported;

function ModuleToBeExported() {}
ModuleToBeExported.prototype.getFs = function () {
    rek('fs');
    return fs;
}