const BENCHMARK_LAYERS = [
  '../../staging/benchmarks/benchmarks_base_2017.json',
  '../../staging/benchmarks/benchmarks_updates_20171109.json'
];

const UNIQUE_COLUMN_CONSTRAINT = [
  'measureId',
  'benchmarkYear',
  'performanceYear',
  'submissionMethod'
];

const getBenchmarkKey = (benchmark) => {
  let benchmarkKey = '';
  UNIQUE_COLUMN_CONSTRAINT.forEach((keyName) => {
    benchmarkKey += benchmark[keyName];
  });

  return benchmarkKey;
};

let mergedBenchmarks = new Map();

BENCHMARK_LAYERS.forEach((benchmarkLayer) => {
  const benchmarkFile = require(benchmarkLayer);
  benchmarkFile.forEach((benchmark) => {
    mergedBenchmarks.set(getBenchmarkKey(benchmark), benchmark);
  });
});

let formattedBenchmarks = [];
for (const value of mergedBenchmarks.values()) {
  formattedBenchmarks.push(value);
}

process.stdout.write(JSON.stringify(formattedBenchmarks, null, 2));
