// Utility functions for formatting the csv records
// Constants
var QUALITY_ID_TO_MEASURE_MAP = require('./constants/quality-id-to-measure-map');
// Utils
var formatSubmissionMethod  = require('./format-submission-method');
var formatDecileGenerator   = require('./format-decile-generator');
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
var formatCsvRecord = function formatCsvRecord(record, options) {
  /**
   * NOTE: Some of the benchmarks don't correspond to
   * any of the measures currently in our json.
   */
  var measure = QUALITY_ID_TO_MEASURE_MAP[record.qualityId];

  if (!measure) return;
  // TODO(sung): Double check that we can/should leave these out.
  if (record.benchmark.trim() === 'N') return;

  return {
    measureId: measure.measureId,
    benchmarkYear: options.benchmarkYear,
    performanceYear: options.performanceYear,
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

module.exports = formatCsvRecord;
