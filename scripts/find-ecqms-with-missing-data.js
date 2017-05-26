#!/usr/bin/env node

/*
Run this on measures-data.json to generate a scaffold for filling in missing ecqm data.
The util/manually-added-ecqm-data.json file will be (re)written.

Usage: ./scripts/find-ecqms-with-missing-data.js measures/measures-data.json
*/

const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const measuresDataPath = process.argv[2];
if (!measuresDataPath) {
  console.log('Missing required argument <path to measures-data.json>');
  process.exit(1);
}

// There are two measures that are known outliers; CMS145v5 and CMS160v5, which are added
// manually here to be merged in by merge-measures-data.js
const outlierEcqms = [
  {
    "eMeasureId": "CMS145v5",
    "strata": [
      {
        "description": "Patients with an order for at least one high-risk medication during the measurement period.",
        "name": "overall",
        "eMeasureUuids": {
          "initialPopulationUuid": "C7BCE5A3-AC0D-440E-AA29-C98239F37A8B",
          "denominatorUuid": "07F04D61-0383-487E-942C-690BBBC6437D",
          "numeratorUuid": "7A0001AC-4BE0-4FAA-94AE-4843C9FFFCA8",
          "denominatorExclusionUuid": "718a29a0-49b3-4483-ab9d-dc37074f39f5",
          "denominatorExceptionUuid": "bba507df-e957-4649-98b9-ff70c1dd7971"
        }
      },
      {
        "description": "Patients with an order for at least two different high-risk medications during the measurement period.",
        "name": "2+",
        "eMeasureUuids": {
          "initialPopulationUuid": "BC02D7CE-7133-46C6-8592-658668B09948",
          "denominatorUuid": "00401314-1B01-4896-A9FC-E991CDF29B6B",
          "numeratorUuid": "FA7BF805-C21E-4077-B43E-C63F8D17B5CF",
          "denominatorExclusionUuid": "41d84550-23c6-46a7-bb50-85708fa8607b",
          "denominatorExceptionUuid": "0e953aff-ae2e-4a74-b774-ca3d9cd40e00"
        }
      }
    ]
  },
  {
    "eMeasureId": "CMS160v5",
    "strata": [
      {
        "description": "Patients with an order for at least one high-risk medication during the measurement period.",
        "name": "overall",
        "eMeasureUuids": {
          "initialPopulationUuid": "C7BCE5A3-AC0D-440E-AA29-C98239F37A8B",
          "denominatorUuid": "07F04D61-0383-487E-942C-690BBBC6437D",
          "numeratorUuid": "7A0001AC-4BE0-4FAA-94AE-4843C9FFFCA8",
          "denominatorExclusionUuid": "718a29a0-49b3-4483-ab9d-dc37074f39f5",
          "denominatorExceptionUuid": "bba507df-e957-4649-98b9-ff70c1dd7971"
        }
      },
      {
        "description": "Patients with an order for at least two different high-risk medications during the measurement period.",
        "name": "2+",
        "eMeasureUuids": {
          "initialPopulationUuid": "BC02D7CE-7133-46C6-8592-658668B09948",
          "denominatorUuid": "00401314-1B01-4896-A9FC-E991CDF29B6B",
          "numeratorUuid": "FA7BF805-C21E-4077-B43E-C63F8D17B5CF",
          "denominatorExclusionUuid": "41d84550-23c6-46a7-bb50-85708fa8607b",
          "denominatorExceptionUuid": "0e953aff-ae2e-4a74-b774-ca3d9cd40e00"
        }
      }
    ]
  }
];

const measuresJson = JSON.parse(fs.readFileSync(measuresDataPath, 'utf8'));
const ecqmsWithMissingData = measuresJson
  .filter(measure => measure.category === 'quality')
  .filter(measure => measure.strata.some(stratum => !stratum.name))
  .map(measure => {
    const strata = measure.strata
      .filter(stratum => !stratum.name)
      .map(stratum => ({
        name: '',
        description: stratum.description // for deducing name
      }));

    const scaffold = {
      eMeasureId: measure.eMeasureId, // for keying purposes
      strata
    };

    // add stub for overallAlgorithm if needed
    if (measure.strata.length > 1 && !measure.overallAlgorithm) {
      scaffold.overallAlgorithm = '';
    }
    return scaffold;
  });

const missingJson = outlierEcqms.concat(ecqmsWithMissingData);
const sortedMissingJson = _.sortBy(missingJson, ['eMeasureId']);
fs.writeFileSync(path.join(__dirname, '../util/manually-added-ecqm-data.json'), JSON.stringify(sortedMissingJson, null, 2));
