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
var lodash_1 = __importDefault(require("lodash"));
var fs_1 = __importDefault(require("fs"));
var sync_1 = __importDefault(require("csv-parse/lib/sync"));
var path_1 = __importDefault(require("path"));
var validation_util_1 = require("../lib/validation-util");
var performanceYear = process.argv[2];
var measuresPath = "../../../measures/" + performanceYear + "/measures-data.json";
var changesPath = "../../../updates/measures/" + performanceYear + "/";
var measuresJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, measuresPath), 'utf8'));
var changelog = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, changesPath + "Changelog.json"), 'utf8'));
var numOfNewChangeFiles = 0;
var BASE_CSV_COLUMN_NAMES = {
    'title': 'title',
    'description': 'description',
    'measureId': 'measure_id'
};
var IA_CSV_COLUMN_NAMES = __assign(__assign({}, BASE_CSV_COLUMN_NAMES), { 'weight': 'weight', 'subcategoryId': 'subcategory_name' });
var PI_CSV_COLUMN_NAMES = __assign(__assign({}, BASE_CSV_COLUMN_NAMES), { 'required': 'required', 'isRequired': 'required', 'metricType': 'name', 'isBonus': 'bonus', 'reportingCategory': 'reporting_category', 'substitutes': 'substitutes', 'exclusion': 'exclusions' });
function makeChanges() {
    var files = fs_1.default.readdirSync(path_1.default.join(__dirname, changesPath));
    files.forEach(function (fileName) {
        if (fileName != 'Changelog.json') {
            if (!changelog.includes(fileName)) {
                numOfNewChangeFiles++;
                updateMeasuresWithChangeFile(fileName, changesPath);
            }
        }
    });
    if (numOfNewChangeFiles > 0) {
        writeToFile(measuresJson, measuresPath);
    }
    else {
        console.info('\x1b[33m%s\x1b[0m', "No new change files found.");
    }
}
function convertCsvToJson(fileName, changesPath) {
    var csv = fs_1.default.readFileSync(path_1.default.join(__dirname, "" + changesPath + fileName), 'utf8');
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
function updateMeasuresWithChangeFile(fileName, changesPath) {
    var changeData = convertCsvToJson(fileName, changesPath);
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
        updateChangeLog(fileName, changesPath);
        console.info('\x1b[32m%s\x1b[0m', "File '" + fileName + "' successfully ingested into measures-data " + performanceYear);
    }
    else {
        console.error('\x1b[31m%s\x1b[0m', "[ERROR]: Some changes failed for file '" + fileName + "'. More info logged above.");
    }
}
function updateChangeLog(fileName, changesPath) {
    changelog.push(fileName);
    writeToFile(changelog, changesPath + "Changelog.json");
}
function writeToFile(file, filePath) {
    fs_1.default.writeFile(path_1.default.join(__dirname, filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err)
            return console.log(err);
    });
}
function updateMeasure(change) {
    for (var i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].measureId == change.measureId) {
            measuresJson[i] = __assign(__assign({}, measuresJson[i]), change);
        }
    }
}
makeChanges();
