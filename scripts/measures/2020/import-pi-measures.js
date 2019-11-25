const parse = require('csv-parse/lib/sync');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const Constants = require('../../../constants.js');

/**
 * `import-pi-measures` reads an PI CSV file and creates valid measures,
 * then writes the resulting json to a staging measures-data-pi.js file.
 */

const PI_CSV_COLUMN_NAMES = {
  'measureId': 'measureId',
  'title': 'title',
  'description': 'description',
  'isRequired': 'isRequired',
  'metricType': 'metricType',
  'firstPerformanceYear': 'firstPerformanceYear',
  'lastPerformanceYear': 'lastPerformanceYear',
  'weight': 'weight',
  'objective': 'objective',
  'isBonus': 'isBonus',
  'reportingCategory': 'reportingCategory',
  'substitutes': 'substitutes',
  'measureSpecification': 'measureSpecification',
  'measureSets': 'measureSets',
  'exclusion': 'exclusion'
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
 * [convertPiCsvToMeasures description]
 * @param {array} piCSVRows - CSV Rows
 * @return {array} Returns an array of measures objects
 *
 * Note: We trim all data sourced from CSVs because people sometimes unintentionally
 * include spaces or line breaks
 */
function convertPiCsvsToMeasures(piCSVRows) {
  return piCSVRows.map((row) => {
    const measure = {};
    measure['category'] = 'pi';
    if (!row['description']) {
      row['description'] = row['description'].replace(/(\r\n\t|\n|\r\t)/gm, '');
    }
    _.each(PI_CSV_COLUMN_NAMES, (measureKeyName, columnName) => {
      if (measureKeyName === 'weight') {
        measure[measureKeyName] = row[columnName] === 'null' ? null : Number(mapInput(row[columnName]));
      } else if (measureKeyName === 'measureSets') {
        measure[measureKeyName] = mapInput(row[columnName]) === null ? [] : [].push(row[columnName]);
      } else if (measureKeyName === 'substitutes') {
        measure[measureKeyName] = mapInput(row[columnName]) === null ? [] : [].push(row[columnName]);
      } else if (measureKeyName === 'objective') { // Values need to be camelcased, but come in as seperate words
        measure[measureKeyName] = _.camelCase(row[columnName]);
      } else {
        measure[measureKeyName] = mapInput(row[columnName]);
      }
    });
    return measure;
  });
}

function importPiMeasures(piMeasuresPath, outputPath) {
  const csv = fs.readFileSync(path.join(__dirname, piMeasuresPath), 'utf8');
  const piCSV = parse(csv, {columns: true});

  const measures = convertPiCsvsToMeasures(piCSV);
  const measuresJSON = JSON.stringify(measures, null, 2);

  fs.writeFileSync(path.join(__dirname, outputPath), measuresJSON);
}

const measuresPath = process.argv[2];
const outputPath = process.argv[3];

importPiMeasures(measuresPath, outputPath);
