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
  'Activity Name': 'title',
  'Activity Description': 'description',
  'Activity ID': 'measureId',
  'metricType': 'metricType',
  'firstPerformanceYear': 'firstPerformanceYear',
  'lastPerformanceYear': 'lastPerformanceYear',
  'weight': 'weight',
  'subcategoryId': 'subcategoryId',
  'cehrtEligible': 'cehrtEligible'
};

// Accounts for TRUE, True, true, X, x...
// and people sometimes insert extra spaces
function cleanInput(input) {
  return input.trim().toLowerCase();
}

// map specific csv input values to their representation in the measures schema
function mapInput(rawInput) {
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
 * [convertCsvToMeasures description]
 * @param  {array of objects}  each object in the array represents
 * a new measure (row)
 * @return {array}            Returns an array of measures objects
 *
 * Note: We trim all data sourced from CSVs because people sometimes unintentionally
 * include spaces or linebreaks
 */
function convertIACSVsToMeasures(iaCSVRows) {
  return iaCSVRows.map((row) => {
    const measure = {};
    _.each(IA_CSV_COLUMN_NAMES, (measureKeyName, columnName) => {
      measure[measureKeyName] = mapInput(row[columnName]);
      measure['category'] = 'ia';
    });
    return measure;
  });
}

function importIAMeasures(iaMeasuresPath, outputPath) {
  const csv = fs.readFileSync(path.join(__dirname, iaMeasuresPath), 'utf8');
  const iaCSV = parse(csv, {columns: true});

  const iaMeasures = convertIACSVsToMeasures(iaCSV);
  const iaMeasuresJSON = JSON.stringify(iaMeasures, null, 2);

  fs.writeFileSync(path.join(__dirname, outputPath), iaMeasuresJSON);
}

const iaMeasuresPath = process.argv[2];
const outputPath = process.argv[3];

importIAMeasures(iaMeasuresPath, outputPath);
