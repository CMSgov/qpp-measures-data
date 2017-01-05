# mips-data-format
The Merit-based Incentive Payment System data format

## How to Use mips-data-format

### Importing the mips-data-format module
Functions take a string version argument and return the appropriate YAML schema or JSON data.
The module can be used with the following pattern:
```javascript
var mipsDataFormat = require('@cmsgov/mips-data-format');
var measuresData = mipsDataFormat.getMeasuresData();
var measuresSchema = mipsDataFormat.getMeasuresSchema();
```

### Generating measures-data.json
To regenerate the `measures-data.json` file, which contains additional metadata and conforms to
the measures schema, run:
```
$ jq -s add <(curl -s https://qpp.cms.gov/api/v1/aci_measures | node util/convert-qpp-to-measures.js aci) <(curl -s https://qpp.cms.gov/rest/api/v1/ia_measures | node util/convert-qpp-to-measures.js ia) > measures/measures-data.json
```

To regenerate the `measures-data.xml` file, run `cat measures/measures-data.json | node util/convert-json-to-xml.js > measures/measures-data.xml`.

### Validation

We've provided a simple tool to validate JSON against our JSON schema. To validate against
`measures-schema.yaml`, run `cat [path to JSON] | node util/validate-data.js [version of schema to validate against] measures`.

For example, running `cat measures/measures-data.json | node util/validate-data.js measures`
validates the latest version of `measures-data.json` against the latest `measures-schema.yaml`.

## How to Contribute to mips-data-format

### Setup

If you don't already have [jq](https://stedolan.github.io/jq/), run `brew install jq`.

Run `npm install`.

### Testing

When making changes to measures-data, include tests in the tests directory and make sure existing tests still pass using:

```
mocha
```
