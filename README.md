# mips-data-format
The Merit Incentive-based Payment System data format

### Setup
Run `npm install`.

### Validation
We've provided a simple tool to validate JSON against our JSON schema. To validate against
`measures-schema.yaml`, run `cat [path to JSON] | node util/validate-measures-data.js [version of schema to validate against]`.
For example, running `cat versions/0.0.1/measures-data.json | node util/validate-measures-data.js 0.0.1`
validates the latest version of `measures-data.json` against the latest `measures-schema.yaml`.

### Generating measures-data.json
To regenerate the `measures-data.js` file, which contains additional metadata and conforms to
the measures schema, run `curl -s https://qpp.cms.gov/rest/api/v1/ia_measures | node util/convert-qpp-to-measures.js [version] > versions/[version]/measures-data.json`.

### Importing the mips-data-format  module
`measuresData` is an object keyed off of version number and can be used with the following pattern:
```javascript
var mipsDataFormat = require('mips-data-format');
var measuresData = mipsDataFormat.measuresData['0.0.1'];
```
