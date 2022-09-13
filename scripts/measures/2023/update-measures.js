"use strict";
/**
 * @UpdateMeasures
 *  This is the primary script behind maintaining the measures data.
 *  It finds all new measures change files, validates their data and
 * structure, updates/adds the specified measures, and reports and
 * success or error messages back to the user.
 *  Currently, this script is designed to intake CSVs, but will be
 * refactored to accept JSON files once the front-end is created.
 */
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
var logger_1 = require("../../logger");
var validate_change_requests_1 = require("../lib/validate-change-requests");
var performanceYear = process.argv[2];
var measuresPath = "../../../measures/".concat(performanceYear, "/measures-data.json");
var changesPath = "../../../updates/measures/".concat(performanceYear, "/");
var measuresJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, measuresPath), 'utf8'));
var changelog = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, "".concat(changesPath, "Changelog.json")), 'utf8'));
//to determine if any new changes need to be written to measures-data.json.
var numOfNewChangeFiles = 0;
//These are only needed if the csv column names do not match the measures-data field names.
var BASE_CSV_COLUMN_NAMES = {
    'title': 'title',
    'description': 'description',
    'measureId': 'measure_id'
};
var IA_CSV_COLUMN_NAMES = __assign(__assign({}, BASE_CSV_COLUMN_NAMES), { 'weight': 'weight', 'subcategoryId': 'subcategory_name' });
var PI_CSV_COLUMN_NAMES = __assign(__assign({}, BASE_CSV_COLUMN_NAMES), { 'required': 'required', 'isRequired': 'required', 'metricType': 'name', 'isBonus': 'bonus', 'reportingCategory': 'reporting_category', 'substitutes': 'substitutes', 'exclusion': 'exclusions' });
var arrayCSVfields = [
    'substitutes',
    'exclusions',
    'submissionMethods',
    'allowedVendors',
    'allowedPrograms',
    'measureSets',
    'submissionMethods',
];
function updateMeasures() {
    var files = fs_1.default.readdirSync(path_1.default.join(__dirname, changesPath));
    files.forEach(function (fileName) {
        //find only the change files not yet present in the changelog.
        if (fileName != 'Changelog.json') {
            if (!changelog.includes(fileName)) {
                numOfNewChangeFiles++;
                updateMeasuresWithChangeFile(fileName);
            }
        }
    });
    if (numOfNewChangeFiles > 0) {
        writeToFile(measuresJson, measuresPath);
    }
    else {
        (0, logger_1.info)("No new change files found.");
    }
}
//not needed once we only accept JSON change requests.
function convertCsvToJson(fileName) {
    var csv = fs_1.default.readFileSync(path_1.default.join(__dirname, "".concat(changesPath).concat(fileName)), 'utf8');
    var parsedCsv = (0, sync_1.default)(csv, { columns: true });
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
        //maps the csv column values to the matching measures-data fields.
        lodash_1.default.each(csvColumnNames, function (columnName, measureKeyName) {
            if (row[columnName]) {
                if (arrayCSVfields.includes(columnName)) {
                    measure[measureKeyName] = csvFieldToArray(row[columnName]);
                }
                measure[measureKeyName] = row[columnName];
            }
        });
        return measure;
    });
}
//converts field 'apples, ice cream, banana' to ['apples', 'ice cream', 'banana'].
function csvFieldToArray(field) {
    var arrayedField = field.split(',');
    for (var i = 0; i < arrayedField.length; i++) {
        arrayedField[i] = arrayedField[i].trim();
    }
    return arrayedField;
}
function updateMeasuresWithChangeFile(fileName) {
    var changeData = convertCsvToJson(fileName);
    var numOfFailures = 0;
    for (var i = 0; i < changeData.length; i++) {
        var change = changeData[i];
        if (change.category) {
            var isNew = isNewMeasure(change.measureId);
            //validation on the change request format. Validation on the updated measures data happens later in update-measures.
            var validate = (0, validate_change_requests_1.initValidation)(validate_change_requests_1.measureType[change.category], isNew);
            if (validate(change)) {
                updateMeasure(change);
                if (isNew) {
                    (0, logger_1.info)("New measure '".concat(change.measureId, "' added."));
                }
            }
            else {
                numOfFailures++;
                console.log(validate.errors);
            }
        }
        else {
            numOfFailures++;
            (0, logger_1.error)("'".concat(fileName, "': category is required."));
        }
    }
    if (numOfFailures === 0) {
        updateChangeLog(fileName);
        (0, logger_1.info)("File '".concat(fileName, "' successfully ingested into measures-data ").concat(performanceYear));
    }
    else {
        (0, logger_1.error)("Some changes failed for file '".concat(fileName, "'. More info logged above."));
    }
}
function updateChangeLog(fileName) {
    changelog.push(fileName);
    writeToFile(changelog, "".concat(changesPath, "Changelog.json"));
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
            break;
        }
    }
}
function isNewMeasure(measureId) {
    var measure = lodash_1.default.find(measuresJson, { 'measureId': measureId });
    return !measure;
}
updateMeasures();
