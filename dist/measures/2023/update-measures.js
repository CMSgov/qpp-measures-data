"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const fs_1 = __importDefault(require("fs"));
const sync_1 = __importDefault(require("csv-parse/lib/sync"));
const path_1 = __importDefault(require("path"));
const app_root_path_1 = __importDefault(require("app-root-path"));
const logger_1 = require("../../logger");
const validate_change_requests_1 = require("../lib/validate-change-requests");
const Constants = __importStar(require("../../constants"));
const performanceYear = process.argv[2];
const measuresPath = `measures/${performanceYear}/measures-data.json`;
const changesPath = `updates/measures/${performanceYear}/`;
const measuresJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(app_root_path_1.default + '', measuresPath), 'utf8'));
const changelog = JSON.parse(fs_1.default.readFileSync(path_1.default.join(app_root_path_1.default + '', `${changesPath}Changelog.json`), 'utf8'));
let numOfNewChangeFiles = 0;
function updateMeasures() {
    const files = fs_1.default.readdirSync(path_1.default.join(app_root_path_1.default + '', changesPath));
    files.forEach(fileName => {
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
        (0, logger_1.info)(`No new change files found.`);
    }
}
function convertCsvToJson(fileName) {
    const csv = fs_1.default.readFileSync(path_1.default.join(app_root_path_1.default + '', `${changesPath}${fileName}`), 'utf8');
    const parsedCsv = (0, sync_1.default)(csv, { columns: true });
    return parsedCsv.map((row) => {
        const measure = {};
        measure['category'] = row['Category'].toLowerCase();
        let csvColumnNames;
        switch (measure['category']) {
            case 'ia':
                csvColumnNames = Constants.IA_CSV_COLUMN_NAMES;
                break;
            case 'pi':
                csvColumnNames = Constants.PI_CSV_COLUMN_NAMES;
                break;
            case 'quality':
                csvColumnNames = Constants.QUALITY_CSV_COLUMN_NAMES;
                break;
        }
        lodash_1.default.each(csvColumnNames, (columnName, measureKeyName) => {
            if (row[columnName]) {
                measure[measureKeyName] = mapInput(columnName, row, measure['category'], csvColumnNames);
            }
        });
        return measure;
    });
}
function mapInput(columnName, csvRow, category, csvColumnNames) {
    if (csvRow[columnName] === '') {
        return undefined;
    }
    if (Constants.BOOLEAN_CSV_FIELDS.includes(columnName)) {
        return csvFieldToBoolean(csvRow[columnName]);
    }
    else if (Constants.ARRAY_CSV_FIELDS.includes(columnName)) {
        const rawArray = csvFieldToArray(csvRow[columnName], columnName, csvColumnNames);
        if (columnName === Constants.QUALITY_CSV_COLUMN_NAMES.historic_benchmarks) {
            return rawArray.reduce((obj, item) => {
                return {
                    ...obj,
                    [item]: 'removed',
                };
            }, {});
        }
        return rawArray;
    }
    else if (columnName === Constants.QUALITY_CSV_COLUMN_NAMES.metricType) {
        (0, logger_1.warning)('Metric Type was changed. Was the strata file also updated to match?');
        if (csvRow[columnName].trim() === 'singlePerformanceRate' && category.trim() === 'QCDR') {
            return 'registrySinglePerformanceRate';
        }
    }
    else if (columnName === Constants.QUALITY_CSV_COLUMN_NAMES.overallAlgorithm &&
        csvRow[Constants.QUALITY_CSV_COLUMN_NAMES.metricType].includes('inglePerformanceRate')) {
        return null;
    }
    else if (columnName === Constants.BASE_CSV_COLUMN_NAMES.firstPerformanceYear ||
        columnName === Constants.BASE_CSV_COLUMN_NAMES.yearRemoved) {
        if (columnName === Constants.BASE_CSV_COLUMN_NAMES.firstPerformanceYear) {
            (0, logger_1.warning)('Year Added was changed. Was this deliberate?');
        }
        return +csvRow[columnName];
    }
    return csvRow[columnName].trim();
}
function csvFieldToArray(fieldValue, fieldHeader, csvColumnNames) {
    const arrayedField = fieldValue.split(',');
    if (fieldHeader === Constants.QUALITY_CSV_COLUMN_NAMES.measureType) {
        for (let i = 0; i < arrayedField.length; i++) {
            arrayedField[i] = Constants.MEASURE_TYPES[arrayedField[i].toLowerCase().replace(/\s/g, "")];
        }
    }
    else if (fieldHeader === Constants.QUALITY_CSV_COLUMN_NAMES.measureSets) {
        for (let i = 0; i < arrayedField.length; i++) {
            arrayedField[i] = Constants.MEASURE_SETS[arrayedField[i].replace(/\s/g, "")];
        }
    }
    else if (fieldHeader === Constants.QUALITY_CSV_COLUMN_NAMES.allowedPrograms) {
        for (let i = 0; i < arrayedField.length; i++) {
            arrayedField[i] = Constants.ALLOWED_PROGRAMS[arrayedField[i].replace(/\s/g, "")];
        }
    }
    else if (Constants.COLLECTION_TYPES_FIELDS.includes(fieldHeader)) {
        for (let i = 0; i < arrayedField.length; i++) {
            arrayedField[i] = Constants.COLLECTION_TYPES[arrayedField[i].trim()];
        }
    }
    for (let i = 0; i < arrayedField.length; i++) {
        arrayedField[i] = arrayedField[i].trim();
    }
    return arrayedField;
}
function csvFieldToBoolean(field) {
    switch (field) {
        case 'Y':
            return true;
        case 'N':
            return false;
    }
}
function updateMeasuresWithChangeFile(fileName) {
    const changeData = convertCsvToJson(fileName);
    let numOfFailures = 0;
    for (let i = 0; i < changeData.length; i++) {
        const change = changeData[i];
        if (change.category) {
            const isNew = isNewMeasure(change.measureId);
            const validate = (0, validate_change_requests_1.initValidation)(validate_change_requests_1.measureType[change.category], isNew);
            if (change.yearRemoved && change.yearRemoved == +performanceYear) {
                deleteMeasure(change.measureId);
            }
            else if (change.yearRemoved) {
                numOfFailures++;
                (0, logger_1.error)(`'${fileName}': Year Removed is not current year.`);
            }
            else if (validate(change)) {
                updateMeasure(change);
                if (isNew) {
                    (0, logger_1.info)(`New measure '${change.measureId}' added.`);
                }
            }
            else {
                numOfFailures++;
                console.log(validate.errors);
            }
        }
        else {
            numOfFailures++;
            (0, logger_1.error)(`'${fileName}': Category is required.`);
        }
    }
    if (numOfFailures === 0) {
        updateChangeLog(fileName);
        (0, logger_1.info)(`File '${fileName}' successfully ingested into measures-data ${performanceYear}`);
    }
    else {
        (0, logger_1.error)(`Some changes failed for file '${fileName}'. More info logged above.`);
    }
}
function updateChangeLog(fileName) {
    changelog.push(fileName);
    writeToFile(changelog, `${changesPath}Changelog.json`);
}
function writeToFile(file, filePath) {
    fs_1.default.writeFile(path_1.default.join(app_root_path_1.default + '', filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err)
            return console.log(err);
    });
}
function deleteMeasure(measureId) {
    const measureIndex = lodash_1.default.findIndex(measuresJson, { measureId });
    if (measureIndex > -1) {
        measuresJson.splice(measureIndex, 1);
        (0, logger_1.info)(`Measure '${measureId}' removed.`);
    }
    else {
        (0, logger_1.warning)(`Measure '${measureId}' not found.`);
    }
}
function updateBenchmarksMetaData(change) {
    return {
        isIcdImpacted: change['icdImpacted'] ? !!change['icdImpacted'].length : false,
        isClinicalGuidelineChanged: change['clinicalGuidelineChanged'] ? !!change['clinicalGuidelineChanged'].length : false,
    };
}
function updateMeasure(change) {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].measureId == change.measureId) {
            measuresJson[i] = {
                ...measuresJson[i],
                ...change,
                ...updateBenchmarksMetaData(change),
            };
            break;
        }
    }
}
function isNewMeasure(measureId) {
    const measure = lodash_1.default.find(measuresJson, { 'measureId': measureId });
    return !measure;
}
updateMeasures();
