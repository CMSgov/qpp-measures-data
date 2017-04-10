# qpp-measures-data

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
var qppMeasuresData = require('@cmsgov/qpp-measures-data');
var measuresData = qppMeasuresData.getMeasuresData();
var measuresSchema = qppMeasuresData.getMeasuresSchema();
var benchmarksData = qppMeasuresData.getBenchmarksData(2017);
var benchmarksSchema = qppMeasuresData.getBenchmarksSchema();
```

### Generating measures-data.json
To regenerate the `measures-data.json` file, which contains additional metadata and conforms to
the measures schema, do the following:

1. Download the qpp quality pdfs
	```
	wget https://qpp.cms.gov/docs/QPP_quality_measure_specifications.zip .
	unzip QPP_quality_measure_specifications.zip
	unzip Claims-Registry-Measures.zip
	```
2. Run the convert from pdfs tool to get the quality info from the pdfs. This info needs to be combined with the (manually generated) util/quality-measures-strata-details.json file to get the full quaility measures data.
	```
	node scripts/get-quality-measures-from-pdfs.js Claims-Registry-Measures
	```

Then run this command to generate a new measures-data.json file

```
$ jq -s add util/additional-measures.json <(curl -s https://qpp.cms.gov/api/v1/aci_measures | node scripts/convert-qpp-to-measures.js aci) <(curl -s https://qpp.cms.gov/api/v1/ia_measures | node scripts/convert-qpp-to-measures.js ia) <(curl -s https://qpp.cms.gov/api/v1/quality_measures | node scripts/convert-qpp-to-measures.js quality) | node scripts/merge-measures-data.js | tee measures/measures-data.json
```

To regenerate the `measures-data.xml` file, run `cat measures/measures-data.json | node scripts/convert-json-to-xml.js > measures/measures-data.xml`.

The measures from `additional-measures.json` must be added, as they are not available via the QPP API.

### Generating benchmarks data
To regenerate benchmarks data from historical data use the `scripts/parse-benchmarks-data.js` script
like so `cat data/historical-benchmarks/2015.csv | node scripts/parse-benchmarks-data.js 2015 2017`;

### Validation

We've provided a simple tool to validate JSON against our JSON schema. To validate against
`measures-schema.yaml`, run `cat [path to JSON] | node scripts/validate-data.js measures`.
For benchmarks, run `cat [path to JSON] | node scripts/validate-data.js benchmarks`.

For example, running `cat measures/measures-data.json | node scripts/validate-data.js measures`
validates the latest version of `measures-data.json` against the latest `measures-schema.yaml`.

## How to Contribute to qpp-measures-data

### Setup

Install the following brew modules:
```
brew install jq wget poppler
```

Run `npm install`.

### Testing

When making changes to measures-data, include tests in the tests directory and make sure existing tests still pass using:

```
npm run test
```

### Additional measures

`util/additional-measures.json` includes data objects which are necessary for scoring but are not MIPS measures. At this time `util/additional-measures.json` includes:

1. **Attestations:** Attestations are pre-requisites of submitting additional measurements for a given category.
2. **Exclusions:** Exclusions are optional attestations of conditions which exempt the provider from a corresponding (required) measure. For example, submitting `true` to `ACI_LVPP_1` exempts a user from submitting data for the required measure `ACI_EP_1`.

