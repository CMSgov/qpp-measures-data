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
 * NOTE: We currently don't differentiate between empty CSV fields and CSV fields
 * explicitly marked as false, because there are no optional fields with
 * true/false values. If there ever are, the default: structure / true/false_markers
 * below and the mapInput function would need to be updated.
 */

// Constant fields are not present in the source CSV. They are
// constant across all quality measures, so we insert these fields into every one
const CONSTANT_FIELDS = {
  category: 'quality',
  isRegistryMeasure: false,
  isRiskAdjusted: false
};

// Ignored fields are present in the source CSV but not imported
// into measures data by this script
const IGNORED_FIELDS = [
  'eMeasureUuid',
  'numStrataClaims',
  'numStrataRegistry',
  'numStrataEcqm',
  'registry',
  'claims',
  'cmsWebInterface'
];

// Main set of fields mapped to their default values
// Except for measure type which is a custom mapping
const MAIN_FIELDS = {
  title: undefined,
  eMeasureId: null,
  nqfEMeasureId: null,
  nqfId: null,
  measureId: undefined,
  description: undefined,
  nationalQualityStrategyDomain: undefined,
  measureType: {
    // there should be no capital letters in the keys below
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
  },
  primarySteward: undefined,
  metricType: null,
  firstPerformanceYear: 2017,
  lastPerformanceYear: null,
  isHighPriority: false,
  isInverse: false,
  overallAlgorithm: undefined,
  isIcdImpacted: false,
  isToppedOutByProgram: false
};

// Source CSV column names mapped to their measures data names
const SUBMISSION_METHODS = {
  claimsMethod: 'claims',
  certifiedSurveyVendorMethod: 'certifiedSurveyVendor',
  electronicHealthRecordMethod: 'electronicHealthRecord',
  cmsWebInterfaceMethod: 'cmsWebInterface',
  administrativeClaimsMethod: 'administrativeClaims',
  registryMethod: 'registry'
};

const MEASURE_SETS = [
  'allergyImmunology',
  'anesthesiology',
  'cardiology',
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
];

// markers are what the CSV creators chose as field values;
// they use different conventions for different columns
const MARKERS = {
  truthy: ['true', 'x'],
  falsy: ['false', 'null', 'n/a']
};

function getCsv(csvPath, firstNonHeaderRow) {
  const csv = fs.readFileSync(path.join(__dirname, csvPath), 'utf8');
  const parsedCsv = parse(csv, { columns: true, from: firstNonHeaderRow - 1 });

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
  if (MARKERS.truthy.includes(input)) {
    return true;
  } else if (MARKERS.falsy.includes(input)) {
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

// loop through all the strata in the strata csv and add them to the measure object
// (there exist multiple csv rows of strata for each multiPerformanceRate measure)
function addMultiPerformanceRateStrata(measures, strataRows) {
  _.each(strataRows, row => {
    const measureId = mapInput(row.measureId, 'measureId');
    const stratumName = row.stratumName.trim();
    const description = row.longDescription.trim();

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
  const measures = qualityCsvRows.map((row) => {
    const measure = {
      submissionMethods: [],
      measureSets: []
    };
    _.each(row, (userInput, fieldName) => {
      const input = mapInput(userInput, fieldName);
      if (_.has(MAIN_FIELDS, fieldName)) {
        const fieldMapping = MAIN_FIELDS[fieldName];
        if (_.isObject(fieldMapping)) {
          measure[fieldName] = fieldMapping[cleanInput(input)];
        } else {
          const defaultValue = fieldMapping;
          measure[fieldName] = input || defaultValue;
        }
      } else if (SUBMISSION_METHODS[fieldName]) {
        // multiple csv columns map into the submission methods measure field
        if (input === true) {
          measure['submissionMethods'].push(SUBMISSION_METHODS[fieldName]);
        }
      } else if (MEASURE_SETS.includes(fieldName)) {
        // multiple csv columns map into the submission methods measure field
        if (input === true) {
          measure['measureSets'].push(fieldName);
        }
      } else if (!IGNORED_FIELDS.includes(fieldName)) {
        throw Error('Column ' + fieldName + ' in source data is not recognized');
      }
    });

    _.each(CONSTANT_FIELDS, (measureValue, measureKey) => {
      measure[measureKey] = measureValue;
    });

    return measure;
  });

  return addMultiPerformanceRateStrata(measures, strataCsvRows);
};

function importQualityMeasures() {
  const qualityCsv = getCsv(qualityMeasuresPath, 4);
  const strataCsv = getCsv(qualityStrataPath, 4);

  const qualityMeasures = convertQualityStrataCsvsToMeasures(qualityCsv, strataCsv);
  const qualityMeasuresJson = JSON.stringify(qualityMeasures, null, 2);

  fs.writeFileSync(path.join(__dirname, outputPath), qualityMeasuresJson);
}

const qualityMeasuresPath = process.argv[2];
const qualityStrataPath = process.argv[3];
const outputPath = process.argv[4];

importQualityMeasures();
