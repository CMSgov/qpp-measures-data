// Libraries
var fs    = require('fs');
var parse = require('csv-parse');
var path  = require('path');
// Constants
var BENCHMARK_CSV_COLUMNS = [
  'measureName',
  'qualityId',
  'submissionMethod',
  'measureType',
  'benchmark',
  'decile3',
  'decile4',
  'decile5',
  'decile6',
  'decile7',
  'decile8',
  'decile9',
  'decile10',
  'isToppedOut'
];
// Utils
var formatBenchmarkRecord = require('./../util/format-benchmark-record');
// Data
var benchmarksData   = '';

/**
 *
 * Script to generate benchmark.json file from csv
 * To run: `cat [DATA_CSV_FILE] | node scripts/parse-benchmarks-data.js [BENCHMARK_YEAR] [PERFORMANCE_YEAR]`
 * e.g. `cat data/historical-benchmarks/2015.csv | node scripts/parse-benchmarks-data.js 2015 2017`
 */
var benchmarks = [];
// Commandline Arguments
var benchmarkYear   = process.argv[2];
var performanceYear = process.argv[3];

if (benchmarkYear && performanceYear) {
  process.stdin.setEncoding('utf8');

  process.stdin.on('readable', function() {
    var chunk = process.stdin.read();
    if (chunk !== null) {
      benchmarksData += chunk;
    }
  });

  process.stdin.on('end', function() {
    parse(benchmarksData, {columns: BENCHMARK_CSV_COLUMNS, from: 4}, function(err, records) {
      if (err) {
        console.log(err);
      } else {
        records.forEach(function(record) {
          var benchmark = formatBenchmarkRecord(record, {benchmarkYear: benchmarkYear, performanceYear: performanceYear});

          if (benchmark) benchmarks.push(benchmark);
        });

        fs.writeFileSync(path.join(__dirname, '../benchmarks/' + performanceYear + '.json'), JSON.stringify(benchmarks, null, 2), 'utf8');
      }
    });
});
} else {
  console.log('Please provide a benchmark and performance year like so: `node parse-benchmarks-data.js 2015 2017`');
}
