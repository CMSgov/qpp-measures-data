// Utility functions for formatting the csv records
// Libraries
const keyBy = require('lodash/keyBy');

// Data
const measures = require('../../measures/measures-data.json');
const isInverseBenchmarkRecord = require('../../util/benchmarks/is-inverse-benchmark-record');

// Constants
/**
 * Maps normalized (trimmed and squeezed) submission method values
 * from csv to standard values.
 * @enum {string}
 */
const SUBMISSION_METHOD_MAP = {
  'claims': 'claims',
  'registry': 'registry',
  'registry/qcdr': 'registry',
  'cmswebinterface': 'cmsWebInterface',
  'administrativeclaims': 'administrativeClaims',
  'ehr': 'electronicHealthRecord',
  'cmsapprovedcahpsvendor': 'certifiedSurveyVendor'
};

/**
 * @type {{}} - mapping of integer qualityIds to corresponding measure
 */
const MEASURE_ID_TO_MEASURE_MAP = keyBy(measures, function(measure) {
  /**
   * NOTE: Quality measurements' measureIds are usually string integers.
   * There are some non-integer qualityIds in the demo benchmarks csv,
   * e.g. '316A' and '316B'.
   */
  return measure.measureId.replace(/^0*/, '');
});

// Helper Functions
/**
 *
 * @param {string} submissionMethod - non-normalized version from csv dataset
 * @returns {string} - normalized version
 */
const formatSubmissionMethod = function(submissionMethod) {
  return SUBMISSION_METHOD_MAP[submissionMethod.replace(/\s/g, '').toLowerCase()];
};

const floatRegex = /([0-9]*[.]?[0-9]+)/g;

/**
 * Generator function to create a
 * function that formats the deciles based on options
 *
 * @param {{
 *  measureName: string,
 *  qualityId: string,
 *  submissionMethod: string,
 *  measureType: string,
 *  benchmark: string,
 *  decile1: string?,
 *  decile2: string?,
 *  decile3: string?,
 *  decile4: string?,
 *  decile5: string?,
 *  decile6: string?,
 *  decile7: string?,
 *  decile8: string?,
 *  decile9: string?,
 *  decile10: string?,
 *  isToppedOut: string}} record
 *  @returns {function}
 */
const formatDecileGenerator = function(record) {
  const isInverseMeasure = isInverseBenchmarkRecord(record);
  const top = isInverseMeasure ? 0 : 100;
  const bottom = isInverseMeasure ? 100 : 0;

  /**
   * Params correspond to the Array.map signature
   * @param {string?} decileString - from csv
   * @param {number} index
   * @param {Array} array
   * @return {number | null}
   */
  return function(decileString, index, array) {
    const range = decileString ? decileString.match(floatRegex) : null;
    let nextIndex = index + 1;
    let prevIndex = index - 1;
    let definedPredecessor;
    let definedSuccessor;

    // If decile is explicitly defined:
    if (decileString && range) return parseFloat(range[0]);

    // Find closest neighbors:
    while (prevIndex >= 0 && !definedPredecessor) {
      if (array[prevIndex]) {
        definedPredecessor = array[prevIndex].match(floatRegex);
      }

      prevIndex--;
    }

    while (nextIndex < array.length && !definedSuccessor) {
      if (array[nextIndex]) {
        definedSuccessor = array[nextIndex].match(floatRegex);
      }

      nextIndex++;
    }

    // If only Decile 10 is defined:
    if (!definedPredecessor &&
      definedSuccessor &&
      nextIndex === array.length) {
      if (isInverseMeasure && (index === 1 || index === 2)) {
        return 100;
      } else if (isInverseMeasure) {
        return 0;
      } else if (index === 1 || index === 2) {
        return 0;
      } else {
        return 100;
      }
    }
    // If the decile has neighbors on both sides:
    if (definedPredecessor &&
      definedSuccessor) {
      return parseFloat(definedSuccessor[0]);
    }
    // If neighbors exist only on one side:
    if (!definedPredecessor) return bottom;
    if (!definedSuccessor) return top;
  };
};

// Looks in measures-data.json for an existing measureIds and
// walks through for versions with combinations of spaces as underscores
// and vice versa.
// If found, returns the measureId from the measures-data.json file.
// If none are found, return the padded number or non-spaced version
const formatMeasureId = (measureId) => {
  const measureIdFuzzyMatch = measureId.replace(/(\s|_)/g, '(\\s|_)?');
  const measureIdFuzzyMatchRegEx = new RegExp('^' + measureIdFuzzyMatch + '$');

  for (const knownMeasureID of Object.keys(MEASURE_ID_TO_MEASURE_MAP)) {
    if (knownMeasureID.match(measureIdFuzzyMatchRegEx)) {
      return MEASURE_ID_TO_MEASURE_MAP[knownMeasureID].measureId;
    }
  }

  // If all digits, pad with zeros up to the hundredth place
  // else, return a nonspaced version
  if (measureId.match(/^\d+$/)) {
    return ('000' + measureId).slice(-3);
  } else {
    return measureId.replace(/\s/g, '');
  }
};

/**
 *
 * @param {{
 *  measureName: string,
 *  qualityId: string,
 *  submissionMethod: string,
 *  measureType: string,
 *  benchmark: string,
 *  decile1: string?,
 *  decile2: string?,
 *  decile3: string?,
 *  decile4: string?,
 *  decile5: string?,
 *  decile6: string?,
 *  decile7: string?,
 *  decile8: string?,
 *  decile9: string?,
 *  decile10: string?,
 *  isToppedOut: string
 *  }} record - csv record object
 * @param {{
 *  benchmarkYear: string,
 *  performanceYear: string
 * }} options - 4 digit year strings for benchmark and performance years
 * @returns {{
 *  measureId: string,
 *  benchmarkYear: string,
 *  performanceYear: string,
 *  submissionMethod: string,
 *  deciles: Array<null|number>
 *  } | undefined
 * } - benchmark object
 */
const formatBenchmarkRecord = function(record, options) {
  /**
   * NOTE: Some of the benchmarks don't correspond to
   * any of the measures currently in our json.
   * NOTE: Quality measurement measureIds are equal to their qualityIds.
   */

  if (record.benchmark.trim() !== 'Y') return;
  return {
    measureId: formatMeasureId(record.qualityId),
    benchmarkYear: parseInt(options.benchmarkYear),
    performanceYear: parseInt(options.performanceYear),
    submissionMethod: formatSubmissionMethod(record.submissionMethod),
    deciles: [
      record.decile1,
      record.decile2,
      record.decile3,
      record.decile4,
      record.decile5,
      record.decile6,
      record.decile7,
      record.decile8,
      record.decile9,
      record.decile10
    ]
      .map(formatDecileGenerator(record))
      .slice(1, 10)
  };
};

module.exports = {
  formatBenchmarkRecord,
  formatMeasureId
};
