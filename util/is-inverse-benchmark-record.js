/**
 *
 * @param {{}} record
 * @return {boolean}
 */
var isInverseBenchmarkRecord = function(record) {
  if (parseFloat(record.decile10) === 100) return false;
  if (parseFloat(record.decile10) === 0)   return true;
  if (record.decile10 && record.decile10.indexOf('<=') > -1) return true;
  if (record.decile10 && record.decile10.indexOf('>=') > -1) return false;

  var deciles = [
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
  ];

  for (var i = 0; i < deciles.length; i++) {
    var decile = deciles[i];

    if (decile) {
      var range = decile.match(/(\d{0,3}\.?\d{2,})/g);

      if (range) {
        if (range.length === 2 && range[0] !== range[1]) {
          return range[0] > range[1];
        }

        if (range.length === 1) {
          if (decile.indexOf('>=') > -1) return true;
          if (decile.indexOf('<=') > -1) return false;
        }
      }
    }
  }

  return false;
};

module.exports = isInverseBenchmarkRecord;
