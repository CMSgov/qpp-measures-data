// Libraries
var fs    = require('fs');
var parse = require('csv-parse');
var path  = require('path');
// Constants
var DEMO_CSV_COLUMNS = require('./../util/constants/demo-csv-columns');
// Utils
var formatCsvRecord  = require('./../util/format-csv-record');
var isInverseBenchmarkRecord = require('./../util/is-inverse-benchmark-record');
// Data
var benchmarksData   = fs.readFileSync(path.join(__dirname, './../data/historical-benchmarks/2016.csv'), 'utf8');

/**
 *
 * Script to generate benchmark.json file from csv
 * To run: `node parse-2016-benchmarks-data.js`
 *
 * TODO(sung): Generalize this script. Make it take commandline arguments for the year.
 */
var benchmarks = [];
var idToIsInverseMap = {};

parse(benchmarksData, {columns: DEMO_CSV_COLUMNS, from: 4}, function(err, records) {
  if (err) {
    console.log(err);
  } else {
    records.forEach(function(record) {
      var benchmark = formatCsvRecord(record, {benchmarkYear: '2016', performanceYear: '2018'});
      var isInverse = isInverseBenchmarkRecord(record);

      if (benchmark) {
        benchmarks.push(benchmark);
        idToIsInverseMap[benchmark.measureId] = isInverse;
      }
    });

    fs.writeFileSync(path.join(__dirname, '../benchmarks/2016.json'), JSON.stringify(benchmarks, null, 2), 'utf8');
    fs.writeFileSync(path.join(__dirname, '../benchmarks/measure-id-to-is-inverse-map.json'), JSON.stringify(idToIsInverseMap, null, 2), 'utf8');
  }
});
