const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync').parse;
const mergeCostLinks = require('../lib/merge-cost-links');

const measuresDataPath = process.argv[2];
const costLinksPath = process.argv[3];
const outputPath = process.argv[4];

const measuresData = fs.readFileSync(path.join(__dirname, measuresDataPath), 'utf8');
const costLinksData = fs.readFileSync(path.join(__dirname, costLinksPath), 'utf8');

const measures = JSON.parse(measuresData);
const parseConfig = { columns: true, skip_empty_line: true };
const costLinks = parse(costLinksData, parseConfig);

mergeCostLinks(measures, costLinks);

fs.writeFileSync(path.join(__dirname, outputPath), JSON.stringify(measures, null, 2));
