const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');
const mergePiLinks = require('../lib/merge-pi-links');

const measuresDataPath = process.argv[2];
const piLinksPath = process.argv[3];
const outputPath = process.argv[4];

const measuresData = fs.readFileSync(path.join(__dirname, measuresDataPath), 'utf8');
const piLinksData = fs.readFileSync(path.join(__dirname, piLinksPath), 'utf8');

const measures = JSON.parse(measuresData);
const parseConfig = { columns: true, skip_empty_line: true };
const piLinks = parse(piLinksData, parseConfig);

mergePiLinks(measures, piLinks);

fs.writeFileSync(path.join(__dirname, outputPath), JSON.stringify(measures, null, 2));
