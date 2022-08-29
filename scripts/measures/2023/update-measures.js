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
var lodash_1 = __importDefault(require("lodash"));
var fs_1 = __importDefault(require("fs"));
var sync_1 = __importDefault(require("csv-parse/lib/sync"));
var Changelog_json_1 = __importDefault(require("../../../updates/measures/2023/Changelog.json"));
var measures_data_json_1 = __importDefault(require("../../../measures/2023/measures-data.json"));
var validation_util_1 = require("../lib/validation-util");
var numOfNewChangeFiles = 0;
var BASE_CSV_COLUMN_NAMES = {
    'title': 'title',
    'description': 'description',
    'measureId': 'measure_id'
};
var IA_CSV_COLUMN_NAMES = __assign(__assign({}, BASE_CSV_COLUMN_NAMES), { 'weight': 'weight', 'subcategoryId': 'subcategory_name' });
var PI_CSV_COLUMN_NAMES = __assign(__assign({}, BASE_CSV_COLUMN_NAMES), { 'required': 'required', 'isRequired': 'required', 'metricType': 'name', 'isBonus': 'bonus', 'reportingCategory': 'reporting_category', 'substitutes': 'substitutes', 'exclusion': 'exclusions' });
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
function convertCsvToJson(fileName) {
    var csv = fs_1.default.readFileSync("" + changesDir + fileName, 'utf8');
    var parsedCsv = sync_1.default(csv, { columns: true });
    return parsedCsv.map(function (row) {
        var measure = {};
        measure['category'] = row['category'].toLowerCase();
        var csvColumnNames;
        switch (measure['category']) {
            case 'ia':
                csvColumnNames = IA_CSV_COLUMN_NAMES;
                break;
            case 'pi':
                csvColumnNames = PI_CSV_COLUMN_NAMES;
                break;
        }
        lodash_1.default.each(csvColumnNames, function (columnName, measureKeyName) {
            if (row[columnName]) {
                measure[measureKeyName] = row[columnName];
            }
        });
        return measure;
    });
}
function updateMeasuresWithChangeFile(fileName) {
    var changeData = convertCsvToJson(fileName);
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
