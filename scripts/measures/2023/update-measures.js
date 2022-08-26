"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var performanceYear = 2023;
var measuresFileName = "../../../measures/" + performanceYear + "/measures-data.json";
var changesDir = "../../../updates/measures/" + performanceYear + "/";
var fs_1 = __importDefault(require("fs"));
var Changelog_json_1 = __importDefault(require("../../../updates/measures/2023/Changelog.json"));
var measures_data_json_1 = __importDefault(require("../../../measures/2023/measures-data.json"));
var validation_util_1 = require("../lib/validation-util");
var numOfNewChangeFiles = 0;
//hard-type the changelog json to handle empty array (when the PY is first created).
var typedChangelog = Changelog_json_1.default;
function makeChanges() {
    var files = fs_1.default.readdirSync(changesDir);
    files.forEach(function (fileName) {
        if (fileName != 'Changelog.json') {
            if (!typedChangelog.includes(fileName)) {
                numOfNewChangeFiles++;
                updateMeasuresWithChangeFile(fileName);
            }
        }
    });
    if (numOfNewChangeFiles > 0) {
        writeToFile(measures_data_json_1.default, measuresFileName);
    }
    else {
        console.info('\x1b[33m%s\x1b[0m', "No new change files found.");
    }
}
function updateMeasuresWithChangeFile(fileName) {
    var changeDataRaw = fs_1.default.readFileSync("" + changesDir + fileName, 'utf8');
    var changeData = JSON.parse(changeDataRaw);
    var numOfFailures = 0;
    for (var i = 0; i < changeData.length; i++) {
        var change = changeData[i];
        if (change.category) {
            var validate = validation_util_1.initValidation(change.category);
            if (validate(change)) {
                updateMeasure(change);
            }
            else {
                numOfFailures++;
                console.log(validate.errors);
            }
        }
        else {
            numOfFailures++;
            console.error('\x1b[31m%s\x1b[0m', "[ERROR]: '" + fileName + "': category is required.");
        }
    }
    if (numOfFailures === 0) {
        updateChangeLog(fileName);
        console.info('\x1b[32m%s\x1b[0m', "File '" + fileName + "' successfully ingested into measures-data " + performanceYear);
    }
    else {
        console.error('\x1b[31m%s\x1b[0m', "[ERROR]: Some changes failed for file '" + fileName + "'. More info logged above.");
    }
}
function updateChangeLog(fileName) {
    typedChangelog.push(fileName);
    writeToFile(typedChangelog, changesDir + "Changelog.json");
}
function writeToFile(file, fileName) {
    fs_1.default.writeFile(fileName, JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err)
            return console.log(err);
    });
}
function updateMeasure(change) {
    for (var i = 0; i < measures_data_json_1.default.length; i++) {
        if (measures_data_json_1.default[i].measureId == change.measureId) {
            measures_data_json_1.default[i] = __assign(__assign({}, measures_data_json_1.default[i]), change);
        }
    }
}
makeChanges();
