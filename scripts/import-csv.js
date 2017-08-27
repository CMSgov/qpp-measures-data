const parse = require('csv-parse/lib/sync');
const YAML = require('yamljs');

// newmeasures=$(cat util/measures/2017-PIMMS-non-mips_measure_specifications.csv | node ./scripts/import-csv.js util/measures/qcdr-config.yaml)
// echo $newmeasures | node scripts/validate-data.js measures
// jq -s add <(cat util/measures/2017-PIMMS-non-mips_measure_specifications.csv | node ./scripts/import-csv.js util/measures/qcdr-config.yaml) <(cat measures/measures-data.json) | tee measures/measures-data.json
const importCsv = require('./import-csv');

const config = YAML.load(process.argv[2]);
// TODO: make this configurable
const header = true;
let csvFile = '';

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    csvFile += chunk;
  }
});

process.stdin.on('end', function() {
  const records = parse(csvFile, 'utf8');
  if (header) {
    records.shift();
  }

  process.stdout.write(JSON.stringify(importCsv(records, config), null, 2));
});
