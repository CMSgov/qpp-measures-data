const parse = require('csv-parse/lib/sync');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const XRegExp = require('xregexp');

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
// constant across quality measures, so we insert these fields into every measure
const CONSTANT_FIELDS = {
  category: 'quality',
  isRegistryMeasure: false,
  isRiskAdjusted: false,
  icdImpacted: [],
  isClinicalGuidelineChanged: false,
  isIcdImpacted: false,
  clinicalGuidelineChanged: []
};

const REFERENCED_FIELDS = [
  'numStrataRegistry'
];

// Main set of fields below mapped to their default values
// Undefined means the field has no default in the CSV; if a field ends
// up undefined in the json, its CSV value is unintentionally missing
const MAIN_FIELDS = {
  title: undefined,
  eMeasureId: null,
  nqfEMeasureId: null,
  nqfId: null,
  measureId: undefined,
  description: undefined,
  nationalQualityStrategyDomain: undefined,
  measureType: undefined,
  primarySteward: undefined,
  // metricType: null,
  firstPerformanceYear: 2017,
  lastPerformanceYear: null,
  isHighPriority: false,
  isInverse: false,
  overallAlgorithm: undefined
};

// Source CSV column names below are mapped to their measures data names
const SUBMISSION_METHODS = {
  methodsClaims: 'claims',
  methodsCertifiedSurveyVendor: 'certifiedSurveyVendor',
  methodsElectronicHealthRecord: 'electronicHealthRecord',
  methodsCmsWebInterface: 'cmsWebInterface',
  methodsAdministrativeClaims: 'administrativeClaims',
  methodsRegistry: 'registry'
};

// Source CSV column names below are identical to their measures data names so no mapping
// const MEASURE_SPECIFICATIONS = [
//   `default`,
//   `claims`,
//   `registry`,
//   `cmsWebInterface`,
//   `electronicHealthRecord`
// ];

const MEASURE_SETS = [
  'allergyImmunology',
  'anesthesiology',
  'cardiology',
  'electrophysiologyCardiacSpecialist',
  'gastroenterology',
  'dermatology',
  'emergencyMedicine',
  'familyMedicine',
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
  'oncology',
  'radiationOncology',
  'hospitalists',
  'rheumatology',
  'nephrology',
  'infectiousDisease',
  'neurosurgical',
  'podiatry',
  'physicalTherapyOccupationalTherapy',
  'geriatrics',
  'urgentCare',
  'skilledNursingFacility',
  'dentistry',
  'endocrinology', // New in 2020 here and below!
  'nutritionDietician',
  'pulmonology',
  'chiropracticMedicine',
  'clinicalSocialWork',
  'audiology',
  'speechLanguagePathology',
  'clinicalSocialWork',
  'certifiedNurseMidwife'
];

// map program names from the appropriate fields
const PROGRAMS = {
  programMIPS: 'mips',
  programPCF: 'pcf',
  programAPP1: 'app1'
};

// map program names for measurements required for a program
const REQUIRED_FOR_PROGRAM = {
  requiredPCF: 'pcf'
};

// Mapping values within the measureType column to valid enums
const MEASURE_TYPES = {
  // there should be no capital letters in the keys below
  'process': 'process',
  'outcome': 'outcome',
  'patient engagement/experience': 'patientEngagementExperience',
  'efficiency': 'efficiency',
  'intermediate outcome': 'intermediateOutcome',
  'structure': 'structure',
  'patient reported outcome': 'patientReportedOutcome',
  'patient-reported outcome-based performance measure': 'patientReportedOutcome'
};

const OVERALL_ALGORITHMS = {
  'simple average': 'simpleAverage',
  'weighted average': 'weightedAverage',
  'sum numerators': 'sumNumerators',
  'overall stratum only': 'overallStratumOnly'
};

// Measure IDs for CAHPS Measures
const CAHPS_MEASURES = [
  'ACO321',
  '321'
];

// Measure IDs for CostScore Measures
const COST_MEASURES = [
  '458',
  '479',
  '480',
  '484'
];

// markers are what the CSV creators chose as field values;
// they use different conventions for different columns
// any perf year that is not the current year, that is not in a date column, should be ignored
const MARKERS = {
  truthy: ['true', 'x', 'y'],
  falsy: ['false', 'null', 'n/a', '-', 'n', ...(_.initial(Constants.validPerformanceYears))]
};

const ALL_MEASURE_FIELDS = Object.keys(MAIN_FIELDS).concat(
  _.keys(SUBMISSION_METHODS),
  _.keys(PROGRAMS),
  _.keys(REQUIRED_FOR_PROGRAM),
  MEASURE_SETS,
  // MEASURE_SPECIFICATIONS,
  REFERENCED_FIELDS
);

function getCsv(csvPath, firstNonHeaderRow) {
  const csv = fs.readFileSync(path.join(__dirname, csvPath), 'utf8');
  return parse(csv, { columns: true, from: firstNonHeaderRow - 1 });
}

// Make sure the quality CSV isn't missing any fields, and doesn't have any
// extra unrecognized fields either (besides IGNORED_FIELDS)
function checkQualityCsvHeaders(parsedCsv) {
  const allCsvFields = _.keys(_.head(parsedCsv));
  const missingFieldsInCsv = _.difference(ALL_MEASURE_FIELDS, allCsvFields);
  if (!_.isEmpty(missingFieldsInCsv)) {
    throw Error('The CSV is missing fields: ' + missingFieldsInCsv);
  }
}

// map specific csv input values to their representation in the measures schema
function mapInput(rawInput, fieldName) {
  // account for TRUE, True, true, X, x, extra spaces...
  const input = rawInput.toString().trim().toLowerCase();

  if (fieldName === 'measureType') {
    return MEASURE_TYPES[input];
  } else if (fieldName === 'overallAlgorithm') {
    if (MARKERS.falsy.includes(input)) {
      return undefined;
    } else if (OVERALL_ALGORITHMS[input]) {
      return OVERALL_ALGORITHMS[input];
    } else if (/^\d+/.test(input)) {
      // numeric values indicate an overall stratum
      return 'overallStratumOnly';
    } else {
      // unknown value, will trigger validation error
      return 'unknown';
    }
  } else if (['description', 'primarySteward', 'title'].includes(fieldName)) {
    let text = rawInput.trim();
    // replace non-standard dashes
    // XRegExp needed since js does not support unicode regexes (e.g., \p{...})
    text = text.replace(XRegExp('\\p{Pd}', 'gm'), '-');
    // replace non-standard quotes
    text = text.replace(/(“|”)/gm, '"');
    text = text.replace(/’/gm, '\'');
    // remove non printing and non-ascii characters (not in the 0-127 block)
    // eslint-disable-next-line no-control-regex
    text = text.replace(/(\r\n\t|\n|\r|\r\t|[^\x00-\x7F])/gm, '');
    return text;
  } else if (fieldName === 'firstPerformanceYear' || fieldName === 'lastPerformanceYear') {
    if (Constants.validPerformanceYears.includes(Number(input))) {
      return Number(input);
    } else {
      return null;
    }
  } else if (fieldName === 'measureId') { // Excel strips leading zeroes from the measureIds/nqfIds and we restore them here
    return _.padStart(input, 3, '0').toUpperCase();
  } else if (fieldName === 'nqfId') {
    if (MARKERS.falsy.includes(input)) {
      return null;
    } else {
      return _.padStart(input, 4, '0');
    }
  }

  // Some fields have values for multiple years, but should include a truthy identifier if the value is true for current year
  const firstValue = _.first(_.split(input, /\s/));
  if (MARKERS.truthy.includes(input) || MARKERS.truthy.includes(firstValue)) {
    return true;
  } else if (MARKERS.falsy.includes(input) || MARKERS.falsy.includes(firstValue)) {
    // we return false here; the eventual value will be the default value in
    // QUALITY_CSV_CONFIG, e.g. null
    return false;
  } else {
    return rawInput.trim();
  }
}

// loop through all the strata in the strata csv and add them to the measure object
// (there exist multiple csv rows of strata for each multiPerformanceRate measure)
function addMultiPerformanceRateStrata(measures, strataRows) {
  _.each(strataRows, row => {
    const measureId = mapInput(row.measureId, 'measureId');
    const stratumName = row.stratumName.trim();
    const description = row.longDescription.trim().replace(/\r/g, '');

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
}

/**
 * [convertCsvToMeasures description]
 * @param  {array} qualityCsvRows - each array in the outer array represents
 * a new measure (row), each inner array its attributes (field/column)
 * @param  {array} strataCsvRows - same as above but for multi-performance rate
 * measures strata; each row is a stratum and there are multiple rows per
 * multi-performance measure
 * @return {array} Returns an array of measures objects
 *
 * Notes:
 * 1. The terms [performance rate] 'strata' and 'performance rates' are used
 * interchangeably
 * 2. We trim all data sourced from CSVs because people sometimes unintentionally
 * include spaces or line-breaks
 */
function convertQualityStrataCsvsToMeasures(qualityCsvRows, strataCsvRows) {
  const measures = qualityCsvRows.map((row) => {
    const measure = {};
    const submissionMethods = [];
    const measureSets = [];
    const measureSpecification = {};
    const allowedPrograms = [];
    const requiredForPrograms = [];
    let perfRates;

    // loop through each row of quality-measures.csv (which we've already
    // parsed into objects with csv headers as keys and row values as values)
    // and use the associated header to decide how to process each column value.
    _.each(row, (userInput, fieldName) => {
      if (ALL_MEASURE_FIELDS.includes(fieldName)) {
        const input = mapInput(userInput, fieldName);
        if (_.has(MAIN_FIELDS, fieldName)) {
          measure[fieldName] = input || MAIN_FIELDS[fieldName];
        } else if (SUBMISSION_METHODS[fieldName]) {
          // multiple csv columns map into the submission methods measure field
          if (input === true) {
            submissionMethods.push(SUBMISSION_METHODS[fieldName]);
          }
        } else if (PROGRAMS[fieldName]) {
          // multiple csv columns map into the programs measure field
          if (input === true) {
            allowedPrograms.push(PROGRAMS[fieldName]);
          }
        } else if (REQUIRED_FOR_PROGRAM[fieldName]) {
          // multiple csv columns map into the requiredForProgram measure field
          if (input === true) {
            requiredForPrograms.push(REQUIRED_FOR_PROGRAM[fieldName]);
          }
        } else if (MEASURE_SETS.includes(fieldName)) {
          // multiple csv columns map into the measure sets measure field
          if (input === true) {
            measureSets.push(fieldName);
          }
        // } else if (MEASURE_SPECIFICATIONS.includes(fieldName)) {
        //   // measure spec columns are stored within the measureSpecification object
        //   if (input) {
        //     measureSpecification[fieldName] = input;
        //   }
        } else if (fieldName === 'numStrataRegistry') {
          perfRates = input;
        }
      } // else ignore unused fields
    });

    _.each(CONSTANT_FIELDS, (measureValue, measureKey) => {
      measure[measureKey] = measureValue;
    });

    let metricType;
    if (CAHPS_MEASURES.includes(measure.measureId)) {
      metricType = 'cahps';
    } else if (COST_MEASURES.includes(measure.measureId)) {
      metricType = 'costScore';
    } else if (perfRates === '1') {
      metricType = 'singlePerformanceRate';
    } else {
      metricType = 'multiPerformanceRate';
    }

    // We don't assign these directly to `measure` above because we want to
    // maintain legacy key ordering for easy diffing in measures-data.json
    measure['metricType'] = metricType;
    measure['allowedPrograms'] = allowedPrograms;
    requiredForPrograms.length && (measure['requiredForPrograms'] = requiredForPrograms);
    measure['submissionMethods'] = submissionMethods;
    measure['measureSets'] = measureSets;
    measure['measureSpecification'] = measureSpecification;
    return measure;
  });

  const activeMeasures = _.filter(measures, (measure) => _.isNull(measure.lastPerformanceYear) || measure.lastPerformanceYear > Constants.currentPerformanceYear);

  return addMultiPerformanceRateStrata(activeMeasures, strataCsvRows);
}

function importQualityMeasures() {
  const qualityCsv = getCsv(qualityMeasuresPath, 2);
  const strataCsv = getCsv(qualityStrataPath, 2);
  checkQualityCsvHeaders(qualityCsv);
  const qualityMeasures = convertQualityStrataCsvsToMeasures(qualityCsv, strataCsv);
  const qualityMeasuresJson = JSON.stringify(qualityMeasures, null, 2);

  fs.writeFileSync(path.join(__dirname, outputPath), qualityMeasuresJson);
}

const qualityMeasuresPath = process.argv[2];
const qualityStrataPath = process.argv[3];
const outputPath = process.argv[4];

importQualityMeasures();
