/**
 *
 * @param {{}} benchmark
 * @returns {boolean}
 */
var isInverseBenchmark = function isInverseBenchmark(benchmark) {
  var deciles = benchmark.deciles.filter(function(val) {
    return val !== null
  });
  var lastDecile = deciles[deciles.length - 1];

  if (lastDecile === 100) return false;
  if (lastDecile === 0) return true;

  return deciles[0] > deciles[1];
};

module.exports = isInverseBenchmark;
