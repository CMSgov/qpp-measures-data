import fs from 'fs';
import path from 'path';
import parse from 'csv-parse/lib/sync';

import mergeEcqmEhrLinks from '../lib/merge-ecqm-ehr-links';
import mergeWebInterfaceLinks from '../lib/merge-web-interface-links';
import mergeClaimsLinks from '../lib/merge-claims-links';
import mergeCqmLinks from '../lib/merge-cqm-links';
import mergePiLinks from '../lib/merge-pi-links';
import mergeCostLinks from '../lib/merge-cost-links';
import mergeEcqmData from '../lib/merge-ecqm-data';
import mergeStratifications from '../lib/merge-stratifications';

const currentPerformanceYear = process.argv[2];

const measuresDataPath = path.join(__dirname, `../../../measures/${currentPerformanceYear}/measures-data.json`);
const ecqmEhrLinksPath = path.join(__dirname, `../../../util/measures/${currentPerformanceYear}/ecqm-ehr-links.csv`);
const webInterfaceLinksPath = path.join(__dirname, `../../../util/measures/${currentPerformanceYear}/web-interface-links.csv`);
const claimsLinksPath = path.join(__dirname, `../../../util/measures/${currentPerformanceYear}/claims-links.csv`);
const cqmLinksPath = path.join(__dirname, `../../../util/measures/${currentPerformanceYear}/cqm-links.csv`);
const piLinksPath = path.join(__dirname, `../../../util/measures/${currentPerformanceYear}/pi-links.csv`);
const costLinksPath = path.join(__dirname, `../../../util/measures/${currentPerformanceYear}/cost-links.csv`);
const generatedEcqmPath = path.join(__dirname, `../../../util/measures/${currentPerformanceYear}/generated-ecqm-data.json`);
const manuallyCreatedEcqmPath = path.join(__dirname, `../../../util/measures/${currentPerformanceYear}/manually-created-missing-measures.json`);
const AdditionalStratificationsPath = path.join(__dirname, `../../../util/measures/${currentPerformanceYear}/additional-stratifications.json`);

const measures = JSON.parse(
    fs.readFileSync(measuresDataPath, 'utf8')
);
const parseConfig = { columns: true, skip_empty_lines: true };


function getCsvIfExists(filePath: string) {
    if(fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');
        return parse(fileData, parseConfig);
    } else {
        return [];
    }
}

function getJsonIfExists(filePath: string) {
    if(fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileData);
    } else {
        return [];
    }
}

mergeEcqmEhrLinks(measures, getCsvIfExists(ecqmEhrLinksPath));
mergeWebInterfaceLinks(measures, getCsvIfExists(webInterfaceLinksPath));
mergeClaimsLinks(measures, getCsvIfExists(claimsLinksPath));
mergeCqmLinks(measures, getCsvIfExists(cqmLinksPath));
mergePiLinks(measures, getCsvIfExists(piLinksPath));
mergeCostLinks(measures, getCsvIfExists(costLinksPath));
mergeEcqmData(measures, getJsonIfExists(generatedEcqmPath));
mergeEcqmData(measures, getJsonIfExists(manuallyCreatedEcqmPath));
mergeStratifications(measures, getJsonIfExists(AdditionalStratificationsPath));
