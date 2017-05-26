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
    "overallAlgorithm": "weightedAverage",
    "metricType": "multiPerformanceRate",
    "strata": [
      {
        "description": "Beta Blocker Therapy for LVSD",
        "name": "betaBlockerTherapyForLVSD",
        "eMeasureUuids": {
          "initialPopulationUuid": "27982FD6-7C42-44E7-A871-0BB7F858A6D5",
          "denominatorUuid": "2294F966-EECD-4C61-8D94-D5E4B09BD9BB",
          "numeratorUuid": "02A4DDAC-D615-457A-9304-F1E382D3811C",
          "denominatorExclusionUuid": "e497e337-9671-4805-94e9-1c7113bf187b",
          "denominatorExceptionUuid": "487E15AB-CDE2-4955-9B93-1A2CDAE6B1F2"
        }
      },
      {
        "description": "Beta Blocker Therapy",
        "name": "betaBlockerTherapy",
        "eMeasureUuids": {
          "initialPopulationUuid": "2EE8137A-4627-471C-8837-85BDBF665017",
          "denominatorUuid": "CC31BC83-F06C-4381-8A4F-1EEBE9ECF7BC",
          "numeratorUuid": "5C03C433-8F8A-4204-B536-D7381835CE8C",
          "denominatorExclusionUuid": "1804358a-4620-44e2-8fb9-526eecdc2fd1",
          "denominatorExceptionUuid": "F79E2A13-6F9E-4B84-99E0-4603E99C83C3"
        }
      }
    ]
  },
  {
    "eMeasureId": "CMS160v5",
    "overallAlgorithm": "weightedAverage",
    "metricType": "multiPerformanceRate",
    "strata": [
      {
        "description": "Office visit, Psych visit, or Face to Face Interaction (No ED) within 4 months of the end of the measurement period that leads to a diagnosis of major depression including remission or dysthymia",
        "name": "diagnosisVisitWithin4MonthsOfEnd",
        "eMeasureUuids": {
          "initialPopulationUuid": "92656CE7-C9B1-44A8-8778-A8EF1ED90A18",
          "denominatorUuid": "C7DFE664-71AE-4EAD-AB65-CDFCF825A44E",
          "numeratorUuid": "B5FA6E85-0F2E-4674-A3F8-E14D834E73AB",
          "denominatorExclusionUuid": "76B54A59-41A9-4664-B85C-F61238AE1DC4",
          "denominatorExceptionUuid": "1c1e013a-b202-4f9e-9ee5-02be9507b7c4"
        }
      },
      {
        "description": "Office visit, Psych visit, or Face to Face Interaction (No ED) between 4 and 8 months after the start of the measurement period that leads to a diagnosis of major depression including remission or dysthymia",
        "name": "diagnosisVisitBetween4And8MonthsAfterStart",
        "eMeasureUuids": {
          "initialPopulationUuid": "757F3066-31E7-45D1-BA50-3EFB27ABB8E5",
          "denominatorUuid": "32635FEA-918B-438F-8421-8A6A14E238E8",
          "numeratorUuid": "33538979-8425-45A4-B724-D74CC0A84EF3",
          "denominatorExclusionUuid": "29931862-020D-401E-B9E9-953791263D87",
          "denominatorExceptionUuid": "a9770f07-3989-4c20-8a7a-605e4a77cbe2"
        }
      },
      {
        "description": "Office visit, Psych visit, or Face to Face Interaction (No ED) within 4 months of the start of the measurement period that leads to a diagnosis of major depression including remission or dysthymia",
        "name": "diagnosisVisitWithin4MonthsOfStart",
        "eMeasureUuids": {
          "initialPopulationUuid": "5631A7DF-CA44-4AD4-A691-DC0CED303F6A",
          "denominatorUuid": "9665A8D2-F896-47A9-AA7E-271E9815D3CE",
          "numeratorUuid": "2D4D6446-C9CD-4661-868B-C8B9B13A8E08",
          "denominatorExclusionUuid": "910A0EE9-ECDA-494C-83E9-30DD9E224FFB",
          "denominatorExceptionUuid": "2cc2a6f9-d57f-48f0-ac88-7b8670cf4f4c"
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
