"use strict";
/**
 * @InitializeMeasuresData
 *  Currently this file just increments eMeasureIds from the previous year.
 * e.g. CMS122v10 -> CMS122v11
 *  Any future initialization logic added here should have its own function which
 * is then called in initMeasuresData().
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var logger_1 = require("../logger");
var performanceYear = process.argv[2];
var measuresPath = "../../measures/".concat(performanceYear, "/measures-data.json");
var measuresJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, measuresPath), 'utf8'));
function initMeasuresData() {
    incrementEMeasureId();
}
function incrementEMeasureId() {
    for (var i = 0; i < measuresJson.length; i++) {
        if (lodash_1.default.isString(measuresJson[i].eMeasureId)) {
            var splitId = lodash_1.default.split(measuresJson[i].eMeasureId, 'v');
            if (splitId.length === 2 && lodash_1.default.isNumber(+splitId[1])) {
                measuresJson[i].eMeasureId = splitId[0] + 'v' + (+splitId[1] + 1);
            }
            else {
                (0, logger_1.error)("Failed to increment eMeasureId ".concat(measuresJson[i].eMeasureId));
            }
        }
    }
    writeToFile(measuresJson, measuresPath);
}
function writeToFile(file, filePath) {
    fs_1.default.writeFile(path_1.default.join(__dirname, filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err)
            return console.log(err);
    });
}
initMeasuresData();
