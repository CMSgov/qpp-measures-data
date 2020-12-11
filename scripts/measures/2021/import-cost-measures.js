const parse = require('csv-parse/lib/sync');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const Constants = require('../../../constants.js');
/**
 * `import-cost-measures` reads an COST CSV file and creates valid measures,
 * then writes the resulting json to a staging measures-data-cost.js file.
 */

const COST_CSV_COLUMN_NAMES = {
  'title': 'title',
  'description': 'description',
  'measureId': 'measureId',
  'metricType': 'metricType',
  'firstPerformanceYear': 'firstPerformanceYear',
  'lastPerformanceYear': 'lastPerformanceYear',
  'isInverse': 'isInverse',
  'overallAlgorithm': 'overallAlgorithm',
  'submissionMethods': 'submissionMethods'
};

// Source CSV column names below are identical to their measures data names so no mapping
const MEASURE_SPECIFICATIONS = [ 'default' ];

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
 * [convertCostCsvsToMeasures description]
 * @param  {array} costCSVRows - objects in the array represents
 * a new measure (row)
 * @return {array} Returns an array of measures objects
 *
 * Note: We trim all data sourced from CSVs because people sometimes unintentionally
 * include spaces or line-breaks
 */
function convertCostCsvsToMeasures(costCSVRows) {
  return costCSVRows.map((row) => {
    const measureSpecification = {};

    const measure = {};
    measure['category'] = 'cost';
    if (row['description']) {
      row['description'] = row['description'].replace(/(\r\n\t|\n|\r\t)/gm, '');
    }
    _.each(COST_CSV_COLUMN_NAMES, (measureKeyName, columnName) => {
      if (measureKeyName === 'submissionMethods') {
        console.log('** ' + row[columnName]);
        measure[measureKeyName] = row[columnName] ? [row[columnName]] : [];
      } else {
        measure[measureKeyName] = mapInput(row[columnName]);
      }
    });

    _.each(MEASURE_SPECIFICATIONS, (measureSpec) => {
      if (row[measureSpec]) {
        measureSpecification[measureSpec] = row[measureSpec];
      }
    });
    measure['measureSpecification'] = measureSpecification;
    return measure;
  });
}

function importCostMeasures(costMeasuresPath, outputPath) {
  const csv = fs.readFileSync(path.join(__dirname, costMeasuresPath), 'utf8');
  const costCSV = parse(csv, {columns: true});

  const costMeasures = convertCostCsvsToMeasures(costCSV);
  const costMeasuresJSON = JSON.stringify(costMeasures, null, 2);

  fs.writeFileSync(path.join(__dirname, outputPath), costMeasuresJSON);
}

const costMeasuresPath = process.argv[2];
const outputPath = process.argv[3];

importCostMeasures(costMeasuresPath, outputPath);
