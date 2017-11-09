const BENCHMARK_LAYERS = [
  '../../staging/benchmarks/benchmarks_base_2017.json',
  '../../staging/benchmarks/benchmarks_updates_20171109.json',
  '../../staging/benchmarks/benchmarks_readmission_20171109.json'
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
    benchmarkKey += `${benchmark[keyName]}|`;
  });

  return benchmarkKey;
};

const mergeBenchmarkLayers = (benchmarkLayers) => {
  const mergedBenchmarks = new Map();

  benchmarkLayers.forEach((benchmarkLayer) => {
    const benchmarkFile = require(benchmarkLayer);
    benchmarkFile.forEach((benchmark) => {
      mergedBenchmarks.set(getBenchmarkKey(benchmark), benchmark);
    });
  });

  const formattedBenchmarks = [];
  for (const value of mergedBenchmarks.values()) {
    formattedBenchmarks.push(value);
  }

  return formattedBenchmarks;
};

const formattedBenchmarks = mergeBenchmarkLayers(BENCHMARK_LAYERS);

process.stdout.write(JSON.stringify(formattedBenchmarks, null, 2));
