const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const parse = require('csv-parse/lib/sync');

const currentYear = 2019;

const measuresDataPath = process.argv[2];
const outputPath = process.argv[3];
const qpp = fs.readFileSync(path.join(__dirname, measuresDataPath), 'utf8');
fs.writeFileSync(path.join(__dirname, outputPath), enrichMeasures(JSON.parse(qpp)));

/*
Takes the quality measures from the build-2019-measures and adds them to the measures-data.json
Running this will generate a file at util/measures/generated-ecqm-data.json

Usage: Ran as part of the build-2019-measures.sh script

Each ecqm entry will look similar to this in measures-data.json
  {
    "eMeasureId": "CMS117v5",
    "eMeasureUuid": "40280381-52fc-3a32-0153-1a4ba57f0b8a",
    "strata": [
      {
        "name": "strata1",
        "description": "Children who have evidence showing they received recommended vaccines, had documented history of the illness, had a seropositive test result, or had an allergic reaction to the vaccine by their second birthday",
        "eMeasureUuids": {
          "initialPopulationUuid": "DA379EC2-EE2E-4548-AEF0-DD4F14F80279",
          "denominatorUuid": "CC8AFFF0-A436-42CD-8322-5EBCEF9CBF06",
          "numeratorUuid": "AE7A33AF-0DA7-4772-A23C-2D2CA732D53A",
          "denominatorExclusionUuid": "19d26b5e-9be2-4313-80f4-67be1e0dde37",
          "denominatorExceptionUuid": "01a1c883-e2e6-4aec-81de-17f3cd9b63b3"
        }
      }
    ],
    "metricType": "singlePerformanceRate"
  },
*/
function enrichMeasures(measures) {
  mergeGeneratedEcqmData(measures);
  addQualityStrataNames(measures);
  addRequiredRegistrySubmissionMethod(measures);
  return JSON.stringify(measures, null, 2);
};

/**
 * Merges the updated 2018 generated measure data UUID's into the current quality measures.
 * generated-ecqm-data.json was made from running get-strata-uuids-from-ecqm-zip-2018.js on the eCQM_EP_EC_May2017.zip file
 */
function mergeGeneratedEcqmData(measures) {
  const generatedEcqmStrataJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../util/measures/generated-ecqm-data.json'), 'utf8'));

  measures.forEach(function(qppItem, index) {
    if (qppItem.category !== 'quality') return;
    const ecqmInfo = _.find(generatedEcqmStrataJson, {'eMeasureId': qppItem.eMeasureId});
    if (!ecqmInfo) return;
    ecqmInfo.strata.name = measures[index].strata.name;
    measures[index].eMeasureUuid = ecqmInfo.eMeasureUuid;
    measures[index].metricType = ecqmInfo.metricType;
    measures[index].strata = ecqmInfo.strata;
  });

  // This is a manually created file from from the eCQM_EP_EC_May2017.zip for the 4 missing measures.
  const manuallyAddedEcqmStrataJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../util/measures/' + currentYear + '/manually-created-missing-measures.json'), 'utf8'));
  measures.forEach(function(qppItem, index) {
    if (qppItem.category !== 'quality') return;
    const manualEcqmInfo = _.find(manuallyAddedEcqmStrataJson, {'eMeasureId': qppItem.eMeasureId});
    if (!manualEcqmInfo) return;
    measures[index].eMeasureUuid = manualEcqmInfo.eMeasureUuid;
    measures[index].metricType = manualEcqmInfo.metricType;
    measures[index].strata = manualEcqmInfo.strata;
    if (manualEcqmInfo.overallAlgorithm) {
      measures[index].overallAlgorithm = manualEcqmInfo.overallAlgorithm;
    }
  });
}

/*
 * Uses numeratorUuid field as a common id to map each strata name (only in `enriched-measures-data-quality.json`)
 * to a particular strata (in `quality-strata.csv`)
 */
function addQualityStrataNames(measures) {
  const qualityStrataCsv = parse(fs.readFileSync(path.join(__dirname, '../../../util/measures/' + currentYear + '/quality-strata.csv'), 'utf8'));
  qualityStrataCsv.forEach(function(strata, csvIndex) {
    const currentMeasureId = _.padStart(strata[0], 3, '0');
    const currentNumeratorUuid = strata[6];
    const currentStrataName = strata[1];
    if (_.isEmpty(currentNumeratorUuid)) return;
    measures.forEach(function(qppItem, qppIndex) {
      if (qppItem.category !== 'quality' || _.isNull(qppItem.eMeasureId) || qppItem.measureId !== currentMeasureId) return;
      measures[qppIndex].strata.forEach(function(measureStrata, strataIndex) {
        if (_.get(measureStrata, 'eMeasureUuids.numeratorUuid') &&
            measureStrata.eMeasureUuids.numeratorUuid === currentNumeratorUuid) {
          measures[qppIndex].strata[strataIndex].name = currentStrataName;
        }
      });
    });
  });
}

function addRequiredRegistrySubmissionMethod(measures) {
  const eCQMeasures = measures.filter(m => m.eMeasureUuid !== undefined);
  eCQMeasures.forEach(m => {
    if (m.submissionMethods.includes('electronicHealthRecord') && !m.submissionMethods.includes('registry')) {
      m.submissionMethods.push('registry');
    }
  });
}
