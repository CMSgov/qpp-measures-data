# qpp-measures-data
Quality Payments Program Measures Data Repository

## How to Use qpp-measures-data

### Importing the qpp-measures-data module
Functions take a string version argument and return the appropriate YAML schema or JSON data.
The module can be used with the following pattern:
```javascript
var mipsDataFormat = require('@cmsgov/qpp-measures-data');
var measuresData = mipsDataFormat.getMeasuresData('0.0.1');
var measuresSchema = mipsDataFormat.getMeasuresSchema('0.0.1');
```

### Generating measures-data.json
To regenerate the `measures-data.json` file, which contains additional metadata and conforms to
the measures schema, run:
```
$ export VERSION=0.0.1
$ jq -s add <(curl -s https://qpp.cms.gov/api/v1/aci_measures | node util/convert-qpp-to-measures.js $VERSION aci) <(curl -s https://qpp.cms.gov/rest/api/v1/ia_measures | node util/convert-qpp-to-measures.js $VERSION ia) > versions/$VERSION/measures-data.json
```

To regenerate the `measures-data.xml` file, run `cat versions/$VERSION/measures-data.json | node util/convert-json-to-xml.js > versions/$VERSION/measures-data.xml`.

### Validation

We've provided a simple tool to validate JSON against our JSON schema. To validate against
`measures-schema.yaml`, run `cat [path to JSON] | node util/validate-data.js [version of schema to validate against] measures`.

For example, running `cat versions/0.0.1/measures-data.json | node util/validate-data.js 0.0.1 measures`
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
