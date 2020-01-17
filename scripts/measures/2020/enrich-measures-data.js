const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');
const mergeEcqmEhrLinks = require('../lib/merge-ecqm-ehr-links');

const measuresDataPath = process.argv[2];
const ecqmEhrLinksPath = process.argv[3];
const outputPath = process.argv[4];

const measuresData = fs.readFileSync(path.join(__dirname, measuresDataPath), 'utf8');
const ecqmEhrLinksData = fs.readFileSync(path.join(__dirname, ecqmEhrLinksPath), 'utf8');

const measures = JSON.parse(measuresData);
const ecqmEhrLinks = parse(ecqmEhrLinksData, { columns: true, skip_empty_lines: true });

mergeEcqmEhrLinks(measures, ecqmEhrLinks);

fs.writeFileSync(path.join(__dirname, outputPath), JSON.stringify(measures, null, 2));
