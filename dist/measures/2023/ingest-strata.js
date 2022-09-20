"use strict";
/**
 * @IngestStrata
 *  Instead of utilizing an update process (as we do for measures),
 * we handle strata by updating the CSVs in /util and
 * re-inject the data into the measures-data.json.
 */
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestStrata = void 0;
var lodash_1 = __importDefault(require("lodash"));
var fs_1 = __importDefault(require("fs"));
var sync_1 = __importDefault(require("csv-parse/lib/sync"));
var path_1 = __importDefault(require("path"));
var app_root_path_1 = __importDefault(require("app-root-path"));
var performanceYear = process.argv[2];
var strataPath = process.argv[3];
var measuresPath = "measures/".concat(performanceYear, "/measures-data.json");
var measuresJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(app_root_path_1.default + '', measuresPath), 'utf8'));
var strata = (0, sync_1.default)(fs_1.default.readFileSync(path_1.default.join(app_root_path_1.default + '', strataPath), 'utf8'), { columns: true, skip_empty_lines: true });
function ingestStrata() {
    var uniqueMeasureIds = __spreadArray([], __read(new Set(strata.map(function (stratum) { return stratum.measureId; }))), false);
    var _loop_1 = function (i) {
        var measureStrata = lodash_1.default.filter(strata, { 'measureId': uniqueMeasureIds[i] });
        var mappedStrata = measureStrata.map(function (stratum) {
            return {
                name: stratum.stratumName,
                description: stratum.description,
            };
        });
        measuresJson.find(function (measure) { return measure.measureId === uniqueMeasureIds[i]; }).strata = mappedStrata;
    };
    for (var i = 0; i < uniqueMeasureIds.length; i++) {
        _loop_1(i);
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
