const parse = require('csv-parse/lib/sync');

// TODO add ability to ignore header row
const importCsv = function(measures, csvFile, config) {
  const records = parse(csvFile);
  return measures.concat(records);
};

module.exports = importCsv;
