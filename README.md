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
$ jq -s add <(curl -s https://qpp.cms.gov/api/v1/aci_measures | node util/convert-qpp-to-measures.js aci) <(curl -s https://qpp.cms.gov/api/v1/ia_measures | node util/convert-qpp-to-measures.js ia) <(curl -s https://qpp.cms.gov/api/v1/quality_measures | node util/convert-qpp-to-measures.js quality) | tee measures/measures-data.json
```

To regenerate the `measures-data.xml` file, run `cat measures/measures-data.json | node util/convert-json-to-xml.js > measures/measures-data.xml`.

The following measures must be manually added.
```
{
  "category": "ia",
  "firstPerformanceYear": 2017,
  "lastPerformanceYear": null,
  "metricType": "boolean",
  "measureId": "IA_PCMH",
  "cehrtEligible": false,
  "description": "I attest that I am a Patient Centered Medical Home (PCMH) or Comparable Specialty Practice",
  "title": "Patient Centered Medical Home Attestation",
  "weight": null,
  "subcategoryId": null
},
{
  "measureId": "ACI_INFBLO_1",
  "category": "aci",
  "title": "EHR Attestation",
  "description": "I have not  knowingly and willfully take action to limit or restrict the interoperability of certified EHR technology.\nI have responded to requests to retrieve or exchange information—including requests from patients and other health care providers regardless of the requestor's affiliation or technology.\nI have implemented appropriate standards and processes to ensure that its certified EHR technology was connected in accordance with applicable law and standards, allowed patients timely access to their electronic health information; and supported exchange of electronic health information with other health care providers.",
  "metricType": "boolean",
  "firstPerformanceYear": 2017,
  "lastPerformanceYear": null,
  "weight": 0,
  "isRequired": true,
  "isBonus": false,
  "measureSets": [],
  "objective": null
},
{
  "measureId": "ACI_ONCDIR_1",
  "category": "aci",
  "title": "ONC Attestation",
  "description": "I have (1) acknowledged the requirement to cooperate in good faith with ONC direct review health information technology certified under the ONC Health IT Certification Program if a request to assist in ONC direct review is received;\nAND (2) If requested, cooperated in good faith with ONC direct review of his or her health information technology certified under the ONC Health IT Certification Program as authorized by 45 CFR part 170, subpart E, to the extent that such technology meets (or can be used to meet) the definition of CEHRT, including by permitting timely access to such technology and demonstrating its capabilities as implemented and used by the MIPS eligible clinician in the field.",
  "metricType": "boolean",
  "firstPerformanceYear": 2017,
  "lastPerformanceYear": null,
  "weight": 0,
  "isRequired": true,
  "isBonus": false,
  "measureSets": [],
  "objective": null
},
{
  "measureId": "ACI_ONCACB_1",
  "category": "aci",
  "title": "Surveillance Attestation",
  "description": "I have (1) Acknowledged the option to cooperate in good faith with ONC–ACB surveillance of his or her health information technology certified under the ONC Health IT Certification Program if a request to assist in ONC–ACB surveillance is received; and (2) If requested, cooperated in good faith with ONC–ACB surveillance of his or her health information technology certified under the ONC Health IT Certification Program as authorized by 45 CFR part 170, subpart E, to the extent that such technology meets (or can be used to meet) the definition of CEHRT, including by permitting timely access to such technology and demonstrating its capabilities as implemented and used by the MIPS eligible clinician in the field.",
  "metricType": "boolean",
  "firstPerformanceYear": 2017,
  "lastPerformanceYear": null,
  "weight": 0,
  "isRequired": false,
  "isBonus": false,
  "measureSets": [],
  "objective": null
},
{
  "measureId": "ACI_IACEHRT_1",
  "category": "aci",
  "title": "CEHRT Used",
  "description": "Providers have the option to report on participation in an immunization registry for 10 points toward the performance score.",
  "metricType": "boolean",
  "firstPerformanceYear": 2017,
  "lastPerformanceYear": null,
  "weight": 10,
  "isRequired": false,
  "isBonus": true,
  "measureSets": [],
  "objective": null
}
```

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
