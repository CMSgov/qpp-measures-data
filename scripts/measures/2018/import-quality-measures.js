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
    // fields are csv columns indexed starting from 0
    title: 0,
    eMeasureId: {
      index: 1,
      default: null
    },
    nqfEMeasureId: {
      index: 2,
      default: null
    },
    nqfId: {
      index: 3,
      default: null
    },
    measureId: 4,
    description: 5,
    nationalQualityStrategyDomain: 6,
    measureType: {
      index: 7,
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
    primarySteward: 8,
    metricType: 50,
    firstPerformanceYear: {
      index: 51,
      default: 2017
    },
    lastPerformanceYear: {
      index: 52,
      default: null
    },
    isHighPriority: {
      index: 54,
      default: false
    },
    isInverse: {
      index: 55,
      default: false
    },
    overallAlgorithm: 59,
    isIcdImpacted: 64,
    isToppedOutByProgram: 65
  }
};

// mapping from quality measures csv column numbers to submission method array indices
const SUBMISSION_METHODS = {
  CSV_COLUMN_START_INDEX: 9,
  ORDERED_FIELDS: [
    'claims',
    'certifiedSurveyVendor',
    'electronicHealthRecord',
    'cmsWebInterface',
    'administrativeClaims',
    'registry'
  ]
};

// mapping from quality measures csv column numbers to measure sets array indices
const MEASURE_SETS = {
  CSV_COLUMN_START_INDEX: 15,
  ORDERED_FIELDS: [
    'allergyImmunology', // 15 (CSV_COLUMN_START_INDEX)
    'anesthesiology', // 16
    'cardiology', // 17 etc...
    'electrophysiologyCardiacSpecialist',
    'gastroenterology',
    'dermatology',
    'emergencyMedicine',
    'generalPracticeFamilyMedicine',
    'internalMedicine',
    'obstetricsGynecology',
    'ophthalmology',
    'orthopedicSurgery',
    'otolaryngology',
    'pathology',
    'pediatrics',
    'physicalMedicine',
    'plasticSurgery',
    'preventiveMedicine',
    'neurology',
    'mentalBehavioralHealth',
    'diagnosticRadiology',
    'interventionalRadiology',
    'vascularSurgery',
    'generalSurgery',
    'thoracicSurgery',
    'urology',
    'generalOncology',
    'radiationOncology',
    'hospitalists',
    'rheumatology',
    'nephrology',
    'infectiousDisease',
    'neurosurgical',
    'podiatry',
    'dentistry'
  ]
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
function mapInput(rawInput, fieldName) {
  const stringInput = rawInput.toString();
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
    // Excel strips leading zeroes from the measureIds/nqfIds and we restore them here
    let finalInput = stringInput.trim();
    if (fieldName === 'measureId') {
      finalInput = _.padStart(finalInput, 3, '0');
    } else if (fieldName === 'nqfId') {
      finalInput = _.padStart(finalInput, 4, '0');
    }

    return finalInput;
  }
}

// used when multiple csv columns map into a single measure field
function getCheckedColumns(row, columnSet) {
  const checkedColumns = [];

  _.each(columnSet.ORDERED_FIELDS, (value, index) => {
    if (mapInput(row[columnSet.CSV_COLUMN_START_INDEX + index]) === true) {
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
    _.each(sourcedFields, (columnObject, fieldName) => {
      if (typeof columnObject === 'number') {
        const input = row[columnObject];
        if (_.isUndefined(input)) {
          throw Error('Column ' + columnObject + ' does not exist in source data');
        } else if (input !== '') {
          measure[fieldName] = mapInput(input, fieldName);
        }
      } else {
        let value;
        if (columnObject.mappings) {
          const input = cleanInput(row[columnObject.index]);
          value = columnObject.mappings[input];
        } else {
          value = mapInput(row[columnObject.index], fieldName);
        }

        measure[fieldName] = value || columnObject['default'];
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
  const qualityCsv = getCsv(qualityMeasuresPath, 3);
  const strataCsv = getCsv(qualityStrataPath, 2);

  const qualityMeasures = convertQualityStrataCsvsToMeasures(qualityCsv, strataCsv);
  const qualityMeasuresJson = JSON.stringify(qualityMeasures, null, 2);

  fs.writeFileSync(path.join(__dirname, outputPath), qualityMeasuresJson);
}

const qualityMeasuresPath = process.argv[2];
const qualityStrataPath = process.argv[3];
const outputPath = process.argv[4];

importQualityMeasures();
