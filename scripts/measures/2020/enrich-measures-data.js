const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');

const mergeEcqmEhrLinks = require('../lib/merge-ecqm-ehr-links');
const mergeWebInterfaceLinks = require('../lib/merge-web-interface-links');

const measuresDataPath = process.argv[2];
const ecqmEhrLinksPath = process.argv[3];
const webInterfaceLinksPath = process.argv[4];
const outputPath = process.argv[5];

const measuresData = fs.readFileSync(path.join(__dirname, measuresDataPath), 'utf8');
const ecqmEhrLinksData = fs.readFileSync(path.join(__dirname, ecqmEhrLinksPath), 'utf8');
const webInterfaceLinksData = fs.readFileSync(path.join(__dirname, webInterfaceLinksPath), 'utf8');

const measures = JSON.parse(measuresData);

const parseConfig = { columns: true, skip_empty_lines: true };
const ecqmEhrLinks = parse(ecqmEhrLinksData, parseConfig);
const webIntefaceLinks = parse(webInterfaceLinksData, parseConfig);

mergeEcqmEhrLinks(measures, ecqmEhrLinks);
mergeWebInterfaceLinks(measures, webIntefaceLinks);

fs.writeFileSync(path.join(__dirname, outputPath), JSON.stringify(measures, null, 2));
