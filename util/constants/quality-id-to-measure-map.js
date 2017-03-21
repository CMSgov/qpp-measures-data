// Libraries
var keyBy = require('lodash/keyBy');
// Data
var measures = require('../../measures/measures-data.json');

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

module.exports = QUALITY_ID_TO_MEASURE_MAP;
