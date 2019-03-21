// Libraries
const parse = require('csv-parse');
const _ = require('lodash');
// Constants
// Note: Older benchmarks CSVs provided to us (and perhaps future ones)
// end with an extraneous blank column. To accommodate that, just add an
// empty string value at the end of BENCHMARK_CSV_COLUMNS (but eyeball the
// CSV manually first to verify it's actually blank and not a new column!)
const BENCHMARK_CSV_COLUMNS = [
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
const { formatBenchmarkRecord } = require('./format-benchmark-record');
// Data
let benchmarksData = '';

/**
 *
 * Script to generate benchmark.json file from csv
 * To run: `cat [DATA_CSV_FILE] | node scripts/benchmarks/parse-benchmarks-data.js [BENCHMARK_YEAR] [PERFORMANCE_YEAR]`
 * e.g. `cat data/historical-benchmarks/2015.csv | node scripts/benchmarks/parse-benchmarks-data.js 2015 2017`
 */
const benchmarks = [];
// Commandline Arguments
const benchmarkYear = process.argv[2];
const performanceYear = process.argv[3];

if (benchmarkYear && performanceYear) {
  process.stdin.setEncoding('utf8');

  process.stdin.on('readable', function() {
    const chunk = process.stdin.read();
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
          const benchmark = formatBenchmarkRecord(record, {benchmarkYear: benchmarkYear, performanceYear: performanceYear});

          if (benchmark) benchmarks.push(benchmark);
        });

        const orderedBenchmarks = _.sortBy(benchmarks, ['measureId', 'submissionMethod']);
        process.stdout.write(JSON.stringify(orderedBenchmarks, null, 2));
      }
    });
  });
} else {
  console.log('Please provide a benchmark and performance year like so: `node parse-benchmarks-data.js 2015 2017`');
}
