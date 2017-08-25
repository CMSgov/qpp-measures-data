const parse = require('csv-parse/lib/sync');

// TODO add ability to ignore header row
const importCsv = function(measures, csvFile, config) {
  const records = parse(csvFile);
  const sourcedFields = config.sourced_fields;
  const constantFields = config.constant_fields;
  const newMeasures = records.map(function(record) {
    var newMeasure = {};
    Object.entries(sourcedFields).forEach(function([measureKey, colIndex]) {
      newMeasure[measureKey] = record[colIndex];
    });
    Object.entries(constantFields).forEach(function([measureKey, measureValue]) {
      newMeasure[measureKey] = measureValue;
    });
    return newMeasure;
  });
  return measures.concat(newMeasures);
};

module.exports = importCsv;
