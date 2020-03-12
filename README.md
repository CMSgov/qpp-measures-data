# qpp-measures-data

[![Build Status](https://travis-ci.org/CMSgov/qpp-measures-data.svg?branch=master)](https://travis-ci.org/CMSgov/qpp-measures-data)

## Quality Payment Program Measures Data Repository

This is the source of truth for QPP measures data. The previous measures data API is no longer available (qpp.cms.gov/api). The transition to using qpp-measures-data as a source of truth for CMS is ongoing and this data may be subject to modifications. Stability in the API contract for qpp-measures-data is prioritized but not guaranteed.

## How to Use qpp-measures-data

Measures and benchmark data can be accessed by installing the `qpp-measures-data` NPM repository.

The measures data JSON schema is described in `measures/$YEAR/measures-schema.yaml`; $YEAR refers to the performance year. The measures data here combines existing data from the QPP API, with supplementary data found in `util`. To access measures data without installing the NPM repository, run `git clone git@github.com:CMSgov/qpp-measures-data.git` and navigate to `measures/$YEAR/measures-data.json`.

The benchmarks data JSON schema is described in `benchmarks/benchmarks-schema.yaml`.

To access the benchmarks data without installing the NPM repository, run `git clone git@github.com:CMSgov/qpp-measures-data.git` and navigate to `benchmarks/`. Benchmarks data is organized by performance year. For example, `benchmarks/2017.json` contains the benchmarks for performance year 2017
(benchmark year 2015).

### Importing the qpp-measures-data module
Functions take a string version argument and return the appropriate YAML schema or JSON data.

The module can be used with the following pattern:
```javascript
const qppMeasuresData = require('qpp-measures-data');
const measuresData = qppMeasuresData.getMeasuresData($YEAR);
const measuresSchema = qppMeasuresData.getMeasuresSchema($YEAR);
const benchmarksData = qppMeasuresData.getBenchmarksData();
const benchmarkData$YEAR = benchmarksData[$YEAR];
const benchmarksSchema = qppMeasuresData.getBenchmarksSchema();
```

## Contributing

Before creating pull requests, please make sure to review
[CONTRIBUTING.md](CONTRIBUTING.md).
