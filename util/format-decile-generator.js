// Utils
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
 *  decile9: string,
 *  decile10: string,
 *  isToppedOut: string}} record
 *  @returns {function}
 */
var formatDecileGenerator = function formatDecileGenerator(record) {
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

module.exports = formatDecileGenerator;
