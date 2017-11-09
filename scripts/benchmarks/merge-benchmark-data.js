const BENCHMARK_LAYERS = [
  "../../staging/benchmarks/benchmarks_base_2017.json",
  "../../staging/benchmarks/benchmarks_updates_20171109.json"
];

const UNIQUE_COLUMN_CONSTRAINT = [
  "measureId",
  "benchmarkYear",
  "performanceYear",
  "submissionMethod"
];

const get_benchmark_key = (benchmark) => {
  let benchmark_key = "";
  UNIQUE_COLUMN_CONSTRAINT.forEach((key_name) => {
    benchmark_key += benchmark[key_name];
  })

  return benchmark_key
};

let merged_benchmarks = new Map();

BENCHMARK_LAYERS.forEach((benchmark_layer) => {
  const benchmark_file = require(benchmark_layer);
  benchmark_file.forEach((benchmark) => {
    merged_benchmarks.set(get_benchmark_key(benchmark), benchmark);
  });
});

let formatted_benchmarks = [];
for (const value of merged_benchmarks.values()) {
  formatted_benchmarks.push(value);
}

process.stdout.write(JSON.stringify(formatted_benchmarks, null, 2));
