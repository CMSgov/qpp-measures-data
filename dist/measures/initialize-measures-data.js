"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../logger");
const performanceYear = process.argv[2];
const measuresPath = `../../measures/${performanceYear}/measures-data.json`;
const measuresJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, measuresPath), 'utf8'));
function initMeasuresData() {
    incrementEMeasureId();
    removeSpecUrls();
    writeToFile(measuresJson, measuresPath);
}
function incrementEMeasureId() {
    for (let i = 0; i < measuresJson.length; i++) {
        if (lodash_1.default.isString(measuresJson[i].eMeasureId)) {
            const splitId = lodash_1.default.split(measuresJson[i].eMeasureId, 'v');
            if (splitId.length === 2 && lodash_1.default.isNumber(+splitId[1])) {
                measuresJson[i].eMeasureId = splitId[0] + 'v' + (+splitId[1] + 1);
            }
            else {
                (0, logger_1.error)(`Failed to increment eMeasureId ${measuresJson[i].eMeasureId}`);
            }
        }
    }
}
function removeSpecUrls() {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].measureSpecification) {
            measuresJson[i].measureSpecification = {};
        }
    }
}
function writeToFile(file, filePath) {
    fs_1.default.writeFile(path_1.default.join(__dirname, filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err)
            return console.log(err);
    });
}
initMeasuresData();
