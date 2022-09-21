"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sync_1 = __importDefault(require("csv-parse/lib/sync"));
const app_root_path_1 = __importDefault(require("app-root-path"));
const merge_ecqm_ehr_links_1 = require("../lib/merge-ecqm-ehr-links");
const merge_web_interface_links_1 = require("../lib/merge-web-interface-links");
const merge_claims_links_1 = require("../lib/merge-claims-links");
const merge_cqm_links_1 = require("../lib/merge-cqm-links");
const merge_pi_links_1 = require("../lib/merge-pi-links");
const merge_cost_links_1 = require("../lib/merge-cost-links");
const merge_ecqm_data_1 = require("../lib/merge-ecqm-data");
const merge_stratifications_1 = require("../lib/merge-stratifications");
const currentPerformanceYear = process.argv[2];
const measuresDataPath = path_1.default.join(app_root_path_1.default + '', `measures/${currentPerformanceYear}/measures-data.json`);
const ecqmEhrLinksPath = path_1.default.join(app_root_path_1.default + '', `util/measures/${currentPerformanceYear}/ecqm-ehr-links.csv`);
const webInterfaceLinksPath = path_1.default.join(app_root_path_1.default + '', `util/measures/${currentPerformanceYear}/web-interface-links.csv`);
const claimsLinksPath = path_1.default.join(app_root_path_1.default + '', `util/measures/${currentPerformanceYear}/claims-links.csv`);
const cqmLinksPath = path_1.default.join(app_root_path_1.default + '', `util/measures/${currentPerformanceYear}/cqm-links.csv`);
const piLinksPath = path_1.default.join(app_root_path_1.default + '', `util/measures/${currentPerformanceYear}/pi-links.csv`);
const costLinksPath = path_1.default.join(app_root_path_1.default + '', `util/measures/${currentPerformanceYear}/cost-links.csv`);
const generatedEcqmPath = path_1.default.join(app_root_path_1.default + '', `util/measures/${currentPerformanceYear}/generated-ecqm-data.json`);
const manuallyCreatedEcqmPath = path_1.default.join(app_root_path_1.default + '', `util/measures/${currentPerformanceYear}/manually-created-missing-measures.json`);
const AdditionalStratificationsPath = path_1.default.join(app_root_path_1.default + '', `util/measures/${currentPerformanceYear}/additional-stratifications.json`);
const measures = JSON.parse(fs_1.default.readFileSync(measuresDataPath, 'utf8'));
const parseConfig = { columns: true, skip_empty_lines: true };
function getFileDataIfExists(filePath, isCSV = false) {
    if (fs_1.default.existsSync(filePath)) {
        const fileData = fs_1.default.readFileSync(filePath, 'utf8');
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
