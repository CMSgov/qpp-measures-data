// Utility functions for formatting the csv records
// Libraries
var fs    = require('fs');
var keyBy = require('lodash/keyBy');
var path  = require('path');
// Data
var measures = require('./../measures/measures-data.json');
// Constants
/**
 * Maps normalized (trimmed and squeezed) submission method values
 * from csv to standard values.
 * @enum {string}
 */
var SUBMISSION_METHOD_MAP = {
  'claims': 'claims',
  'registry': 'registry',
  'registry/qcdr': 'registry',
  'cmswebinterface': 'cmsWebInterface',
  'administrativeclaims': 'administrativeClaims',
  'ehr': 'ehr',
  'cmsapprovedcahpsvendor': 'cmsApprovedCahpsVendor'
};
/**
 * @type {{}} - mapping of integer qualityIds to corresponding measure
 */
var QUALITY_ID_TO_MEASURE_MAP = keyBy(measures, function(measure) {
  /**
   * NOTE: The qualityId is usually a string integer.
   * There are some non-integer qualityIds in the demo benchmarks csv,
   * e.g. '316A' and '316B'.
   */
  return measure.qualityId ? measure.qualityId.replace(/^0*/, '') : undefined;
});
// Helper Functions
/**
 *
 * @param {string} submissionMethod - non-normalized version from csv dataset
 * @returns {string} - normalized version
 */
var formatSubmissionMethod = function(submissionMethod) {
  return SUBMISSION_METHOD_MAP[submissionMethod.replace(/\s/g, '').toLowerCase()];
};
var isInverseBenchmarkRecord = require('./is-inverse-benchmark-record');
var floatRegex = /([0-9]*[.]?[0-9]+)/g;
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
var formatDecileGenerator = function(record) {
  var isInverseMeasure = isInverseBenchmarkRecord(record);
  var top = isInverseMeasure ? 0 : 100;
  var bottom = isInverseMeasure ? 100 : 0;

  /**
   * Params correspond to the Array.map signature
   * @param {string?} decileString - from csv
   * @param {number} index
   * @param {Array} array
   * @return {number | null}
   */
  return function(decileString, index, array) {
    var range     =  decileString ? decileString.match(floatRegex) : null;
    var nextIndex = index + 1;
    var prevIndex = index - 1;
    var definedPredecessor;
    var definedSuccessor;

    // If decile is explicitly defined:
    if  (decileString && range) return parseFloat(range[0]);

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
      return parseFloat(definedSuccessor[0]);
    }
    // If the decile has neighbors on both sides:
    if (definedPredecessor &&
      definedSuccessor) {
      return parseFloat(definedSuccessor[0]);
    }
    // If neighbors exist only on one side:
    if (!definedPredecessor) return bottom;
    if (!definedSuccessor)   return top;
  };
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
var formatBenchmarkRecord = function(record, options) {
  /**
   * NOTE: Some of the benchmarks don't correspond to
   * any of the measures currently in our json.
   */
  var measure = QUALITY_ID_TO_MEASURE_MAP[record.qualityId];

  if (!measure) return;
  if (record.benchmark.trim() === 'N') return;

  return {
    measureId: measure.measureId,
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
      .slice(1,10)
  };
};

module.exports = formatBenchmarkRecord;
