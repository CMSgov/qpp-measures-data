const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');

const mergeEcqmEhrLinks = require('../lib/merge-ecqm-ehr-links');
const mergeWebInterfaceLinks = require('../lib/merge-web-interface-links');
const mergeClaimsLinks = require('../lib/merge-claims-links');

const measuresDataPath = process.argv[2];
const ecqmEhrLinksPath = process.argv[3];
const webInterfaceLinksPath = process.argv[4];
const claimsLinksPath = process.argv[5];
const outputPath = process.argv[6];

const measuresData = fs.readFileSync(path.join(__dirname, measuresDataPath), 'utf8');
const ecqmEhrLinksData = fs.readFileSync(path.join(__dirname, ecqmEhrLinksPath), 'utf8');
const webInterfaceLinksData = fs.readFileSync(path.join(__dirname, webInterfaceLinksPath), 'utf8');
const claimsLinksData = fs.readFileSync(path.join(__dirname, claimsLinksPath), 'utf8');

const measures = JSON.parse(measuresData);

const parseConfig = { columns: true, skip_empty_lines: true };
const ecqmEhrLinks = parse(ecqmEhrLinksData, parseConfig);
const webIntefaceLinks = parse(webInterfaceLinksData, parseConfig);
const claimsLinks = parse(claimsLinksData, parseConfig);

mergeEcqmEhrLinks(measures, ecqmEhrLinks);
mergeWebInterfaceLinks(measures, webIntefaceLinks);
mergeClaimsLinks(measures, claimsLinks);

fs.writeFileSync(path.join(__dirname, outputPath), JSON.stringify(measures, null, 2));
