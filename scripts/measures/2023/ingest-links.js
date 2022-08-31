"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var sync_1 = __importDefault(require("csv-parse/lib/sync"));
var merge_ecqm_ehr_links_1 = __importDefault(require("../lib/merge-ecqm-ehr-links"));
var merge_web_interface_links_1 = __importDefault(require("../lib/merge-web-interface-links"));
var merge_claims_links_1 = __importDefault(require("../lib/merge-claims-links"));
var merge_cqm_links_1 = __importDefault(require("../lib/merge-cqm-links"));
var merge_pi_links_1 = __importDefault(require("../lib/merge-pi-links"));
var merge_cost_links_1 = __importDefault(require("../lib/merge-cost-links"));
var merge_ecqm_data_1 = __importDefault(require("../lib/merge-ecqm-data"));
var merge_stratifications_1 = __importDefault(require("../lib/merge-stratifications"));
var currentPerformanceYear = process.argv[2];
var measuresDataPath = path_1.default.join(__dirname, "../../../measures/" + currentPerformanceYear + "/measures-data.json");
var ecqmEhrLinksPath = path_1.default.join(__dirname, "../../../util/measures/" + currentPerformanceYear + "/ecqm-ehr-links.csv");
var webInterfaceLinksPath = path_1.default.join(__dirname, "../../../util/measures/" + currentPerformanceYear + "/web-interface-links.csv");
var claimsLinksPath = path_1.default.join(__dirname, "../../../util/measures/" + currentPerformanceYear + "/claims-links.csv");
var cqmLinksPath = path_1.default.join(__dirname, "../../../util/measures/" + currentPerformanceYear + "/cqm-links.csv");
var piLinksPath = path_1.default.join(__dirname, "../../../util/measures/" + currentPerformanceYear + "/pi-links.csv");
var costLinksPath = path_1.default.join(__dirname, "../../../util/measures/" + currentPerformanceYear + "/cost-links.csv");
var generatedEcqmPath = path_1.default.join(__dirname, "../../../util/measures/" + currentPerformanceYear + "/generated-ecqm-data.json");
var manuallyCreatedEcqmPath = path_1.default.join(__dirname, "../../../util/measures/" + currentPerformanceYear + "/manually-created-missing-measures.json");
var AdditionalStratificationsPath = path_1.default.join(__dirname, "../../../util/measures/" + currentPerformanceYear + "/additional-stratifications.json");
var measures = JSON.parse(fs_1.default.readFileSync(measuresDataPath, 'utf8'));
var parseConfig = { columns: true, skip_empty_lines: true };
function getCsvIfExists(filePath) {
    if (fs_1.default.existsSync(filePath)) {
        var fileData = fs_1.default.readFileSync(filePath, 'utf8');
        return sync_1.default(fileData, parseConfig);
    }
    else {
        return [];
    }
}
function getJsonIfExists(filePath) {
    if (fs_1.default.existsSync(filePath)) {
        var fileData = fs_1.default.readFileSync(filePath, 'utf8');
        return JSON.parse(fileData);
    }
    else {
        return [];
    }
}
merge_ecqm_ehr_links_1.default(measures, getCsvIfExists(ecqmEhrLinksPath));
merge_web_interface_links_1.default(measures, getCsvIfExists(webInterfaceLinksPath));
merge_claims_links_1.default(measures, getCsvIfExists(claimsLinksPath));
merge_cqm_links_1.default(measures, getCsvIfExists(cqmLinksPath));
merge_pi_links_1.default(measures, getCsvIfExists(piLinksPath));
merge_cost_links_1.default(measures, getCsvIfExists(costLinksPath));
merge_ecqm_data_1.default(measures, getJsonIfExists(generatedEcqmPath));
merge_ecqm_data_1.default(measures, getJsonIfExists(manuallyCreatedEcqmPath));
merge_stratifications_1.default(measures, getJsonIfExists(AdditionalStratificationsPath));
