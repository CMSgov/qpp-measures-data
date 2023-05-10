const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');

const mergeEcqmEhrLinks = require('../lib/merge-ecqm-ehr-links');
const mergeWebInterfaceLinks = require('../lib/merge-web-interface-links');
const mergeClaimsLinks = require('../lib/merge-claims-links');
const mergeCqmLinks = require('../lib/merge-cqm-links');
const mergeEcqmData = require('../lib/merge-ecqm-data');
const mergeStratifications = require('../lib/merge-stratifications');
const mergeClaimsRelatedData = require('../lib/merge-claims-related-data');

const measuresDataPath = process.argv[2];
const ecqmEhrLinksPath = process.argv[3];
const webInterfaceLinksPath = process.argv[4];
const claimsLinksPath = process.argv[5];
const cqmLinksPath = process.argv[6];
const generatedEcqmDataPath = process.argv[7];
const manuallyCreatedEcqmDataPath = process.argv[8];
const additionalStratificationsPath = process.argv[9];
const claimsRelatedPath = process.argv[10];
const outputPath = process.argv[11];

const measuresData = fs.readFileSync(path.join(__dirname, measuresDataPath), 'utf8');
const ecqmEhrLinksData = fs.readFileSync(path.join(__dirname, ecqmEhrLinksPath), 'utf8');
const webInterfaceLinksData = fs.readFileSync(path.join(__dirname, webInterfaceLinksPath), 'utf8');
const claimsLinksData = fs.readFileSync(path.join(__dirname, claimsLinksPath), 'utf8');
const cqmLinksData = fs.readFileSync(path.join(__dirname, cqmLinksPath), 'utf8');
const generatedEcqmData = fs.readFileSync(path.join(__dirname, generatedEcqmDataPath), 'utf8');
const manuallyCreatedEcqmData = fs.readFileSync(path.join(__dirname, manuallyCreatedEcqmDataPath), 'utf8');
const additionalStratificationsData = fs.readFileSync(path.join(__dirname, additionalStratificationsPath), 'utf8');
const claimsRelatedDataJSON = fs.readFileSync(path.join(__dirname, claimsRelatedPath), 'utf8');

const measures = JSON.parse(measuresData);
const parseConfig = { columns: true, skip_empty_lines: true };

const ecqmEhrLinks = parse(ecqmEhrLinksData, parseConfig);
const webIntefaceLinks = parse(webInterfaceLinksData, parseConfig);
const claimsLinks = parse(claimsLinksData, parseConfig);
const cqmLinks = parse(cqmLinksData, parseConfig);
const generatedEcqms = JSON.parse(generatedEcqmData);
const manuallyCreatedEcqms = JSON.parse(manuallyCreatedEcqmData);
const additionalStratifications = JSON.parse(additionalStratificationsData);
const claimsRelatedData = JSON.parse(claimsRelatedDataJSON);

mergeEcqmEhrLinks(measures, ecqmEhrLinks);
mergeWebInterfaceLinks(measures, webIntefaceLinks);
mergeClaimsLinks(measures, claimsLinks);
mergeCqmLinks(measures, cqmLinks);
mergeEcqmData(measures, generatedEcqms);
mergeEcqmData(measures, manuallyCreatedEcqms);
mergeStratifications(measures, additionalStratifications);
mergeClaimsRelatedData(measures, claimsRelatedData);

fs.writeFileSync(path.join(__dirname, outputPath), JSON.stringify(measures, null, 2));
