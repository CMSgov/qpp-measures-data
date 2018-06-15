const parse = require('csv-parse/lib/sync');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const Constants = require('../../../constants.js');
/**
 * `import-quality-measures` reads a quality CSV file and creates valid measures,
 * then writes the resulting json to a staging measures-data-quality.js file.
 */

/**
 * [config defines how to generate quality measures from origin CSV file]
 * @type {Object}
 *
 *  * `constant_fields` are fields which are the same for all measures being
 *  created from the CSV input.
 *  * `source_fields` are fields which should find values in the CSV input.
 *
 * NOTE: We currently don't differentiate between empty CSV fields and CSV fields
 * explicitly marked as false, because there are no optional fields with
 * true/false values. If there ever are, the default: structure / true/false_markers
 * below and the mapInput function would need to be updated.
 */
const QUALITY_CSV_CONFIG = {
  // markers are what the CSV creators chose as field values;
  // they use different conventions for different columns
  truthy_markers: ['true', 'x'],
  falsy_markers: ['false', 'null', 'n/a'],
  constant_fields: {
    category: 'quality',
    isRegistryMeasure: false,
    isRiskAdjusted: false
  },
  sourced_fields: {
    // fields are csv columns indexed starting from 1 (the provided
    // spreadsheet has a leftmost blank column)
    title: 1,
    eMeasureId: {
      index: 2,
      default: null
    },
    nqfEMeasureId: {
      index: 3,
      default: null
    },
    nqfId: {
      index: 4,
      default: null
    },
    measureId: 5,
    description: 6,
    nationalQualityStrategyDomain: 7,
    measureType: {
      index: 8,
      mappings: { // there should be no capital letters in the keys below
        'process': 'process',
        'outcome': 'outcome',
        'patient engagement/experience': 'patientEngagementExperience',
        'efficiency': 'efficiency',
        'intermediate outcome': 'intermediateOutcome',
        'structure': 'structure',
        'patient reported outcome': 'outcome',
        'composite': 'outcome',
        'cost/resource use': 'efficiency',
        'clinical process effectiveness': 'process'
      }
    },
    primarySteward: 9,
    metricType: 51,
    firstPerformanceYear: {
      index: 52,
      default: 2017
    },
    lastPerformanceYear: {
      index: 53,
      default: null
    },
    isHighPriority: {
      index: 55,
      default: false
    },
    isInverse: {
      index: 56,
      default: false
    },
    overallAlgorithm: 60
  }
};

// mapping from quality measures csv column numbers to submission method
const SUBMISSION_METHODS = {
  10: 'claims',
  11: 'certifiedSurveyVendor',
  12: 'electronicHealthRecord',
  13: 'cmsWebInterface',
  14: 'administrativeClaims',
  15: 'registry'
};

// mapping from quality measures csv column numbers to measure sets
const MEASURE_SETS = {
  16: 'allergyImmunology',
  17: 'anesthesiology',
  18: 'cardiology',
  19: 'electrophysiologyCardiacSpecialist',
  20: 'gastroenterology',
  21: 'dermatology',
  22: 'emergencyMedicine',
  23: 'generalPracticeFamilyMedicine',
  24: 'internalMedicine',
  25: 'obstetricsGynecology',
  26: 'ophthalmology',
  27: 'orthopedicSurgery',
  28: 'otolaryngology',
  29: 'pathology',
  30: 'pediatrics',
  31: 'physicalMedicine',
  32: 'plasticSurgery',
  33: 'preventiveMedicine',
  34: 'neurology',
  35: 'mentalBehavioralHealth',
  36: 'diagnosticRadiology',
  37: 'interventionalRadiology',
  38: 'vascularSurgery',
  39: 'generalSurgery',
  40: 'thoracicSurgery',
  41: 'urology',
  42: 'generalOncology',
  43: 'radiationOncology',
  44: 'hospitalists',
  45: 'rheumatology',
  46: 'nephrology',
  47: 'infectiousDisease',
  48: 'neurosurgical',
  49: 'podiatry',
  50: 'dentistry'
};

function getCsv(csvPath, headerRows = 1) {
  const csv = fs.readFileSync(path.join(__dirname, csvPath), 'utf8');
  const parsedCsv = parse(csv, 'utf8');

  // remove header rows
  for (let i = 0; i < headerRows; i++) {
    parsedCsv.shift();
  }

  return parsedCsv;
}

// Accounts for TRUE, True, true, X, x...
// and people sometimes insert extra spaces
function cleanInput(input) {
  return input.trim().toLowerCase();
}

// map specific csv input values to their representation in the measures schema
function mapInput(rawInput) {
  const input = cleanInput(rawInput);
  if (QUALITY_CSV_CONFIG.truthy_markers.includes(input)) {
    return true;
  } else if (QUALITY_CSV_CONFIG.falsy_markers.includes(input)) {
    // we return false here; the eventual value will be the default value in
    // QUALITY_CSV_CONFIG, e.g. null
    return false;
  } else if (Constants.validPerformanceYears.includes(Number(input))) {
    return Number(input);
  } else {
    // if csv input isn't one of the special cases above, just return it
    return rawInput.trim();
  }
}

// used when multiple csv columns map into a single measure field
function getCheckedColumns(row, columnNumberToNameMap) {
  const checkedColumns = [];

  _.each(columnNumberToNameMap, (value, key) => {
    if (mapInput(row[key]) === true) {
      checkedColumns.push(value);
    }
  });

  return checkedColumns;
}

// loop through all the strata in the strata csv and add them to the measure object
// (there exist multiple csv rows of strata for each multiPerformanceRate measure)
function addMultiPerformanceRateStrata(measures, strataRows) {
  _.each(strataRows, row => {
    if (!row[0]) {
      return; // csv has a blank row, so skip it
    }

    const measureId = row[0].trim();
    const stratumName = row[1].trim();
    const description = row[3].trim();

    const measure = _.find(measures, { measureId });
    if (!measure) {
      throw TypeError('Measure id: ' + measureId + ' does not exist in ' +
        qualityMeasuresPath + ' but does exist in ' + qualityStrataPath);
    }

    if (!measure.strata) {
      measure.strata = [];
    }

    measure.strata.push({
      name: stratumName,
      description: description
    });
  });

  return measures;
};

/**
 * [convertCsvToMeasures description]
 * @param  {array of arrays}  each array in the outer array represents
 * a new measure (row), each inner array its attributes (field/column)
 * @param  {array of arrays}  same as above but for multiperformancerate
 * measures strata; each row is a stratum and there are multiple rows per
 * multiperformance measure
 * @return {array}            Returns an array of measures objects
 *
 * Notes:
 * 1. The terms [performance rate] 'strata' and 'performance rates' are used
 * interchangeably
 * 2. We trim all data sourced from CSVs because people sometimes unintentionally
 * include spaces or linebreaks
 */
function convertQualityStrataCsvsToMeasures(qualityCsvRows, strataCsvRows) {
  const sourcedFields = QUALITY_CSV_CONFIG.sourced_fields;
  const constantFields = QUALITY_CSV_CONFIG.constant_fields;

  const measures = qualityCsvRows.map((row) => {
    const measure = {};
    _.each(sourcedFields, (columnObject, measureKey) => {
      if (typeof columnObject === 'number') {
        const input = row[columnObject];
        if (_.isUndefined(input)) {
          throw Error('Column ' + columnObject + ' does not exist in source data');
        } else if (input !== '') {
          measure[measureKey] = mapInput(input);
        }
      } else {
        let value;
        if (columnObject.mappings) {
          const input = cleanInput(row[columnObject.index]);
          value = columnObject.mappings[input];
        } else {
          value = mapInput(row[columnObject.index]);
        }

        measure[measureKey] = value || columnObject['default'];
      }
    });

    _.each(constantFields, (measureValue, measureKey) => {
      measure[measureKey] = measureValue;
    });

    measure['submissionMethods'] = getCheckedColumns(row, SUBMISSION_METHODS);
    measure['measureSets'] = getCheckedColumns(row, MEASURE_SETS);

    return measure;
  });

  return addMultiPerformanceRateStrata(measures, strataCsvRows);
};

function importQualityMeasures() {
  const qualityCsv = getCsv(qualityMeasuresPath, 2);
  const strataCsv = getCsv(qualityStrataPath, 2);

  const qualityMeasures = convertQualityStrataCsvsToMeasures(qualityCsv, strataCsv);
  const qualityMeasuresJson = JSON.stringify(qualityMeasures, null, 2);

  fs.writeFileSync(path.join(__dirname, outputPath), qualityMeasuresJson);
}

const qualityMeasuresPath = process.argv[2];
const qualityStrataPath = process.argv[3];
const outputPath = process.argv[4];

importQualityMeasures();
