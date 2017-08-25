const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const path = require('path');
const YAML = require('yamljs');

// jq -s add measures/measures-data.json <(node ./scripts/import-csv-script.js) > measures/measures-data.json
const importCsv = require('./import-csv');

const newMeasures = fs.readFileSync(path.join(__dirname, '../util/measures/20170811_Final_2017_PIMMS_MIPS_Non-MIPS_Measure_Specifications.v3.xlsx_-_2017_Non-MIPS_Measure_Specs.csv'));
const config = YAML.load(path.join(__dirname, '../util/measures/qcdr-config.yaml'));

console.log(JSON.stringify(importCsv(newMeasures, config), null, 2));
