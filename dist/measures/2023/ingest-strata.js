"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestStrata = void 0;
const lodash_1 = __importDefault(require("lodash"));
const fs_1 = __importDefault(require("fs"));
const sync_1 = __importDefault(require("csv-parse/lib/sync"));
const path_1 = __importDefault(require("path"));
const app_root_path_1 = __importDefault(require("app-root-path"));
const performanceYear = process.argv[2];
const strataPath = process.argv[3];
const measuresPath = `measures/${performanceYear}/measures-data.json`;
const measuresJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(app_root_path_1.default + '', measuresPath), 'utf8'));
const strata = (0, sync_1.default)(fs_1.default.readFileSync(path_1.default.join(app_root_path_1.default + '', strataPath), 'utf8'), { columns: true, skip_empty_lines: true });
function ingestStrata() {
    const uniqueMeasureIds = [...new Set(strata.map(stratum => stratum.measureId))];
    for (let i = 0; i < uniqueMeasureIds.length; i++) {
        const measureStrata = lodash_1.default.filter(strata, { 'measureId': uniqueMeasureIds[i] });
        const mappedStrata = measureStrata.map(stratum => {
            return {
                name: stratum.stratumName,
                description: stratum.description,
            };
        });
        measuresJson.find(measure => measure.measureId === uniqueMeasureIds[i]).strata = mappedStrata;
    }
    writeToFile(measuresJson, measuresPath);
}
exports.ingestStrata = ingestStrata;
function writeToFile(file, filePath) {
    fs_1.default.writeFile(path_1.default.join(app_root_path_1.default + '', filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err)
            return console.log(err);
    });
}
ingestStrata();
