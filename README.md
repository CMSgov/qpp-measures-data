# qpp-measures-data

[![Build Status](https://travis-ci.org/CMSgov/qpp-measures-data.svg?branch=master)](https://travis-ci.org/CMSgov/qpp-measures-data)

## Quality Payment Program Measures Data Repository

This repository hosts measures data for QPP and supports functionality to import
measures data as an NPM module. It currently hosts all Improvement Activity and
Advancing Care Information measures, as well as a fraction of Quality measures.

This is the alpha v2 source of truth for QPP measures data, building off of the
existing v1 measures data available at [qpp.cms.gov/api](qpp.cms.gov/api).
This data (qpp-measures-data) reformats some of the data from the v1 measures
API and adds some additional information (see `util/convert-qpp-to-measures.js`
for the exact transformations). The transition to using qpp-measures-data as a
source of truth for CMS is ongoing and this data may be subject to
modifications. We are not guaranteeing stability in the API contract for
qpp-measures-data at this time.

## How to Use qpp-measures-data

Measures and benchmark data can be accessed by installing the `qpp-measures-data` NPM repository.
The measures data JSON schema is described in `measures/measures-schema.yaml`. The
measures data here combines existing data from the QPP API, with supplementary data
found in `util`. To access measures data without installing the NPM repository,
run `git clone git@github.com:CMSgov/qpp-measures-data.git` and navigate to
`measures/measures-data.json`.

The benchmarks data JSON schema is described in `benchmarks/benchmarks-schema.yaml`.
To access the benchmarks data without installing the NPM repository,
run `git clone git@github.com:CMSgov/qpp-measures-data.git` and
navigate to `benchmarks/`. Benchmarks data is organized by performance year.
For example, `benchmarks/2017.json` contains the benchmarks for performance year 2017
(benchmark year 2015).

### Importing the qpp-measures-data module
Functions take a string version argument and return the appropriate YAML schema or JSON data.
The module can be used with the following pattern:
```javascript
var qppMeasuresData = require('qpp-measures-data');
var measuresData = qppMeasuresData.getMeasuresData();
var measuresSchema = qppMeasuresData.getMeasuresSchema();
var benchmarksData = qppMeasuresData.getBenchmarksData();
var benchmark2017Data = benchmarksData[2017];
var benchmarksSchema = qppMeasuresData.getBenchmarksSchema();
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
