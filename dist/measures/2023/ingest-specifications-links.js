"use strict";
/**
 * @IngestSpecificationsLinks
 *  Instead of utilizing an update process (as we do for measures),
 * we handle specs links by updating the CSVs in /util and
 * re-inject the data into the measures-data.json.
 *  This is justified since specs links changes are simple,
 * handled internally, and not error-prone.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var sync_1 = __importDefault(require("csv-parse/lib/sync"));
var app_root_path_1 = __importDefault(require("app-root-path"));
var merge_ecqm_ehr_links_1 = require("../lib/merge-ecqm-ehr-links");
var merge_web_interface_links_1 = require("../lib/merge-web-interface-links");
var merge_claims_links_1 = require("../lib/merge-claims-links");
var merge_cqm_links_1 = require("../lib/merge-cqm-links");
var merge_pi_links_1 = require("../lib/merge-pi-links");
var merge_cost_links_1 = require("../lib/merge-cost-links");
var merge_ecqm_data_1 = require("../lib/merge-ecqm-data");
var merge_stratifications_1 = require("../lib/merge-stratifications");
var currentPerformanceYear = process.argv[2];
var measuresDataPath = path_1.default.join(app_root_path_1.default + '', "measures/".concat(currentPerformanceYear, "/measures-data.json"));
var ecqmEhrLinksPath = path_1.default.join(app_root_path_1.default + '', "util/measures/".concat(currentPerformanceYear, "/ecqm-ehr-links.csv"));
var webInterfaceLinksPath = path_1.default.join(app_root_path_1.default + '', "util/measures/".concat(currentPerformanceYear, "/web-interface-links.csv"));
var claimsLinksPath = path_1.default.join(app_root_path_1.default + '', "util/measures/".concat(currentPerformanceYear, "/claims-links.csv"));
var cqmLinksPath = path_1.default.join(app_root_path_1.default + '', "util/measures/".concat(currentPerformanceYear, "/cqm-links.csv"));
var piLinksPath = path_1.default.join(app_root_path_1.default + '', "util/measures/".concat(currentPerformanceYear, "/pi-links.csv"));
var costLinksPath = path_1.default.join(app_root_path_1.default + '', "util/measures/".concat(currentPerformanceYear, "/cost-links.csv"));
var generatedEcqmPath = path_1.default.join(app_root_path_1.default + '', "util/measures/".concat(currentPerformanceYear, "/generated-ecqm-data.json"));
var manuallyCreatedEcqmPath = path_1.default.join(app_root_path_1.default + '', "util/measures/".concat(currentPerformanceYear, "/manually-created-missing-measures.json"));
var AdditionalStratificationsPath = path_1.default.join(app_root_path_1.default + '', "util/measures/".concat(currentPerformanceYear, "/additional-stratifications.json"));
var measures = JSON.parse(fs_1.default.readFileSync(measuresDataPath, 'utf8'));
var parseConfig = { columns: true, skip_empty_lines: true };
function getFileDataIfExists(filePath, isCSV) {
    if (isCSV === void 0) { isCSV = false; }
    if (fs_1.default.existsSync(filePath)) {
        var fileData = fs_1.default.readFileSync(filePath, 'utf8');
        if (isCSV) {
            return (0, sync_1.default)(fileData, parseConfig);
        }
        return JSON.parse(fileData);
    }
    else {
        return [];
    }
}
(0, merge_ecqm_ehr_links_1.mergeEcqmEhrLinks)(measures, getFileDataIfExists(ecqmEhrLinksPath, true));
(0, merge_web_interface_links_1.mergeWebInterfaceLinks)(measures, getFileDataIfExists(webInterfaceLinksPath, true));
(0, merge_claims_links_1.mergeClaimsLinks)(measures, getFileDataIfExists(claimsLinksPath, true));
(0, merge_cqm_links_1.mergeCqmLinks)(measures, getFileDataIfExists(cqmLinksPath, true));
(0, merge_pi_links_1.mergePiLinks)(measures, getFileDataIfExists(piLinksPath, true));
(0, merge_cost_links_1.mergeCostLinks)(measures, getFileDataIfExists(costLinksPath, true));
(0, merge_ecqm_data_1.mergeEcqmData)(measures, getFileDataIfExists(generatedEcqmPath));
(0, merge_ecqm_data_1.mergeEcqmData)(measures, getFileDataIfExists(manuallyCreatedEcqmPath));
(0, merge_stratifications_1.mergeStratifications)(measures, getFileDataIfExists(AdditionalStratificationsPath));
