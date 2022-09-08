"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var sync_1 = __importDefault(require("csv-parse/lib/sync"));
var path_1 = __importDefault(require("path"));
var merge_benchmark_metadata_1 = __importDefault(require("../lib/merge-benchmark-metadata"));
var performanceYear = process.argv[2];
var measuresPath = "../../../measures/".concat(performanceYear, "/measures-data.json");
var benchmarkMetaDataPath = "../../../util/measures/".concat(performanceYear, "/benchmark-metadata.csv");
var measuresJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, measuresPath), 'utf8'));
var benchmarkMetaData = (0, sync_1.default)(fs_1.default.readFileSync(path_1.default.join(__dirname, benchmarkMetaDataPath), 'utf8'), { columns: true, skip_empty_lines: true });
(0, merge_benchmark_metadata_1.default)(measuresJson, benchmarkMetaData, true);
fs_1.default.writeFile(path_1.default.join(__dirname, measuresPath), JSON.stringify(measuresJson, null, 2), function writeJSON(err) {
    if (err)
        return console.log(err);
});
