/**
 * @IngestSpecificationsLinks
 *  Instead of utilizing an update process (as we do for measures),
 * we handle specs links by updating the CSVs in /util and 
 * re-inject the data into the measures-data.json.
 *  This is justified since specs links changes are simple, 
 * handled internally, and not error-prone. 
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import appRoot from 'app-root-path';

import { mergeEcqmEhrLinks } from './merge-ecqm-ehr-links';
import { mergeWebInterfaceLinks } from './merge-web-interface-links';
import { mergeClaimsLinks } from './merge-claims-links';
import { mergeCqmLinks } from './merge-cqm-links';
import { mergePiLinks } from './merge-pi-links';
import { mergeCostLinks } from './merge-cost-links';
import { mergeEcqmData } from './merge-ecqm-data';
import { mergeStratifications } from './merge-stratifications';
import { mergeClaimsRelatedData } from './merge-claims-related-data';

const currentPerformanceYear = process.argv[2];

const measuresDataPath = path.join(appRoot + '', `measures/${currentPerformanceYear}/measures-data.json`);
const ecqmEhrLinksPath = path.join(appRoot + '', `util/measures/${currentPerformanceYear}/ecqm-ehr-links.csv`);
const webInterfaceLinksPath = path.join(appRoot + '', `util/measures/${currentPerformanceYear}/web-interface-links.csv`);
const claimsLinksPath = path.join(appRoot + '', `util/measures/${currentPerformanceYear}/claims-links.csv`);
const cqmLinksPath = path.join(appRoot + '', `util/measures/${currentPerformanceYear}/cqm-links.csv`);
const piLinksPath = path.join(appRoot + '', `util/measures/${currentPerformanceYear}/pi-links.csv`);
const costLinksPath = path.join(appRoot + '', `util/measures/${currentPerformanceYear}/cost-links.csv`);
const generatedEcqmPath = path.join(appRoot + '', `util/measures/${currentPerformanceYear}/generated-ecqm-data.json`);
const manuallyCreatedEcqmPath = path.join(appRoot + '', `util/measures/${currentPerformanceYear}/manually-created-missing-measures.json`);
const AdditionalStratificationsPath = path.join(appRoot + '', `util/measures/${currentPerformanceYear}/additional-stratifications.json`);
const claimsRelatedData = path.join(appRoot + '', `claims-related/data/qpp-single-source-${currentPerformanceYear}.json`);

const measures = JSON.parse(
    fs.readFileSync(measuresDataPath, 'utf8')
);
const parseConfig = { columns: true, skip_empty_lines: true, bom: true };

function getFileDataIfExists(filePath: string, isCSV: boolean = false) {
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');

        if (isCSV) {
            return parse(fileData, parseConfig);
        }
        return JSON.parse(fileData);

    }
    return [];
}

mergeEcqmEhrLinks(measures, getFileDataIfExists(ecqmEhrLinksPath, true));
mergeWebInterfaceLinks(measures, getFileDataIfExists(webInterfaceLinksPath, true));
mergeClaimsLinks(measures, getFileDataIfExists(claimsLinksPath, true));
mergeCqmLinks(measures, getFileDataIfExists(cqmLinksPath, true));
mergePiLinks(measures, getFileDataIfExists(piLinksPath, true));
mergeCostLinks(measures, getFileDataIfExists(costLinksPath, true));
mergeEcqmData(measures, getFileDataIfExists(generatedEcqmPath));
mergeEcqmData(measures, getFileDataIfExists(manuallyCreatedEcqmPath));
mergeStratifications(measures, getFileDataIfExists(AdditionalStratificationsPath));
mergeClaimsRelatedData(measures, getFileDataIfExists(claimsRelatedData));

fs.writeFileSync(measuresDataPath, JSON.stringify(measures, null, 2));
