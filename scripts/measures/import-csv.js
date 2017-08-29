const parse = require('csv-parse/lib/sync');
const YAML = require('yamljs');

/**
 * import-csv reads a CSV file, takes a config file as an argument, reads
 * CSV from stdin and outputs valid measures using convertCsvToMeasures.js
 * Assumes CSV has a header row.
 *
 * example:
 * $ cat util/measures/20170825-PIMMS-non-mips_measure_specifications.csv | node ./scripts/measures/import-csv.js util/measures/qcdr-config.yaml
 * example for CSVs which have no header row:
 * $ cat util/measures/20170825-PIMMS-non-mips_measure_specifications.csv | node ./scripts/measures/import-csv.js util/measures/qcdr-config.yaml --header=false
 *
 * test:
 * $ cat util/measures/20170825-PIMMS-non-mips_measure_specifications.csv | node ./scripts/measures/import-csv.js util/measures/qcdr-config.yaml | node scripts/validate-data.js measures
*/
const convertCsvToMeasures = require('./convert-csv-to-measures');

const config = YAML.load(process.argv[2]);
const skipHeader = process.argv[3] && process.argv[3].split('=')[1] === 'false';
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
  if (!skipHeader) {
    records.shift();
  }

  process.stdout.write(JSON.stringify(convertCsvToMeasures(records, config), null, 2));
});
