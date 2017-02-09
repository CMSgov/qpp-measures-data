# qpp-measures-data
Quality Payments Program Measures Data Repository

## How to Use qpp-measures-data

### Importing the qpp-measures-data module
Functions take a string version argument and return the appropriate YAML schema or JSON data.
The module can be used with the following pattern:
```javascript
var qppMeasuresData = require('@cmsgov/qpp-measures-data');
var measuresData = qppMeasuresData.getMeasuresData();
var measuresSchema = qppMeasuresData.getMeasuresSchema();
```

### Generating measures-data.json
To regenerate the `measures-data.json` file, which contains additional metadata and conforms to
the measures schema, run:
```
$ jq -s add measures/additional-measures.json <(curl -s https://qpp.cms.gov/api/v1/aci_measures | node util/convert-qpp-to-measures.js aci) <(curl -s https://qpp.cms.gov/api/v1/ia_measures | node util/convert-qpp-to-measures.js ia) <(curl -s https://qpp.cms.gov/api/v1/quality_measures | node util/convert-qpp-to-measures.js quality) | tee measures/measures-data.json
```

To regenerate the `measures-data.xml` file, run `cat measures/measures-data.json | node util/convert-json-to-xml.js > measures/measures-data.xml`.

The measures from `additional-measures.json` must be added, as they are not available via the QPP API.

### Validation

We've provided a simple tool to validate JSON against our JSON schema. To validate against
`measures-schema.yaml`, run `cat [path to JSON] | node util/validate-data.js measures`.

For example, running `cat measures/measures-data.json | node util/validate-data.js measures`
validates the latest version of `measures-data.json` against the latest `measures-schema.yaml`.

## How to Contribute to qpp-measures-data

### Setup

If you don't already have [jq](https://stedolan.github.io/jq/), run `brew install jq`.

Run `npm install`.

### Testing

When making changes to measures-data, include tests in the tests directory and make sure existing tests still pass using:

```
mocha
```
