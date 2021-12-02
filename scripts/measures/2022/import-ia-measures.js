const parse = require('csv-parse/lib/sync');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const Constants = require('../../../constants.js');
/**
 * `import-ia-measures` reads an IA CSV file and creates valid measures,
 * then writes the resulting json to a staging measures-data-ia.js file.
 */

const IA_CSV_COLUMN_NAMES = {
  'title': 'title',
  'description': 'description',
  'measureId': 'measureId',
  'metricType': 'metricType',
  'firstPerformanceYear': 'firstPerformanceYear',
  'lastPerformanceYear': 'lastPerformanceYear',
  'weight': 'weight',
  'subcategoryId': 'subcategoryId'
};

// Accounts for TRUE, True, true, X, x...
// and people sometimes insert extra spaces
function cleanInput(input) {
  return input.trim().toLowerCase();
}

// map specific csv input values to their representation in the measures schema
function mapInput(rawInput) {
  if (!rawInput) { return null; }
  const input = cleanInput(rawInput);
  if (input === '' || input === 'null') {
    return null;
  } else if (input === 'true') {
    return true;
  } else if (input === 'false') {
    return false;
  } else if (Constants.validPerformanceYears.includes(Number(input))) {
    return Number(input);
  } else {
    return rawInput.trim();
  }
}

/**
 * [convertIaCsvsToMeasures description]
 * @param  {array of objects}  each object in the array represents
 * a new measure (row)
 * @return {array}            Returns an array of measures objects
 *
 * Note: We trim all data sourced from CSVs because people sometimes unintentionally
 * include spaces or linebreaks
 */
function convertIaCsvsToMeasures(iaCSVRows) {
  return iaCSVRows.map((row) => {
    const measure = {};
    measure['category'] = 'ia';
    if (row['description']) {
      row['description'] = row['description'].replace(/(\r\n\t|\n|\r\t)/gm, '');
    }
    if (row['weight']) {
      row['weight'] = row['weight'].toLowerCase(); // Schema expects lowercased weight
    }
    if (row['subcategoryId']) { // Values need to be camelcased, but come in as seperate words, this would convert "Population Management" to "populationManagement"
      row['subcategoryId'] = _.camelCase(row['subcategoryId']);
    }
    _.each(IA_CSV_COLUMN_NAMES, (measureKeyName, columnName) => {
      measure[measureKeyName] = mapInput(row[columnName]);
    });
    return measure;
  });
}

function importIaMeasures(iaMeasuresPath, outputPath) {
  const csv = fs.readFileSync(path.join(__dirname, iaMeasuresPath), 'utf8');
  const iaCSV = parse(csv, {columns: true});

  const iaMeasures = convertIaCsvsToMeasures(iaCSV);
  const iaMeasuresJSON = JSON.stringify(iaMeasures, null, 2);

  fs.writeFileSync(path.join(__dirname, outputPath), iaMeasuresJSON);
}

const iaMeasuresPath = process.argv[2];
const outputPath = process.argv[3];

importIaMeasures(iaMeasuresPath, outputPath);
