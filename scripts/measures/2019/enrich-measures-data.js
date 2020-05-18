const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const parse = require('csv-parse/lib/sync');

const currentYear = 2019;
const cpcPlusGroups = require('../../../util/measures/' + currentYear + '/cpc+-measure-groups.json');
const stratifications = require('../../../util/measures/' + currentYear + '/additional-stratifications.json');
const QUALITY_CATEGORY = 'quality';
const measuresDataPath = process.argv[2];
const qppSingleSourceJson = process.argv[3];
const outputPath = process.argv[4];
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
  enrichStratifications(measures);
  enrichCPCPlusMeasures(measures);
  addQualityStrataNames(measures);
  enrichClaimsRelatedMeasures(measures);
  return JSON.stringify(measures, null, 2);
}

/**
 * Merges the updated 2018 generated measure data UUID's into the current quality measures.
 * generated-ecqm-data.json was made from running get-strata-uuids-from-ecqm-zip-2018.js on the eCQM_EP_EC_May2017.zip file
 */
function mergeGeneratedEcqmData(measures) {
  const generatedEcqmStrataJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../util/measures/' + currentYear + '/generated-ecqm-data.json'), 'utf8'));

  measures.forEach(function(qppItem, index) {
    if (qppItem.category !== QUALITY_CATEGORY) return;
    const ecqmInfo = _.find(generatedEcqmStrataJson, {'eMeasureId': qppItem.eMeasureId});
    if (!ecqmInfo) return;
    if (ecqmInfo.strata.name) ecqmInfo.strata.name = measures[index].strata.name;
    measures[index].eMeasureUuid = ecqmInfo.eMeasureUuid;
    measures[index].metricType = ecqmInfo.metricType;
    measures[index].strata = ecqmInfo.strata;
  });

  // This is a manually created file from from the eCQM_EP_EC_May_CurrentYear.zip for the missing measures.
  const manuallyAddedEcqmStrataJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../util/measures/' + currentYear + '/manually-created-missing-measures.json'), 'utf8'));
  measures.forEach(function(qppItem, index) {
    if (qppItem.category !== QUALITY_CATEGORY) return;
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

/**
 * Adds in each SubPopulation's stratification UUIDs
 * This JSON document used to derive this is generated using get-stratifications.js
 */
function enrichStratifications(measures) {
  measures
    .filter(measure => measure.category === QUALITY_CATEGORY)
    .forEach(measure => {
      const stratification = stratifications.find(stratum => stratum.eMeasureId === measure.eMeasureId);
      if (stratification && stratification.strataMaps) {
        console.log('Found measure :' + measure.eMeasureId + '\n');
        measure.strata.forEach(subPopulation => {
          let mapping = false;
          if (subPopulation.eMeasureUuids) {
            mapping = stratification.strataMaps.find(map =>
              map.numeratorUuid === subPopulation.eMeasureUuids.numeratorUuid);
          }
          if (mapping) {
            subPopulation.eMeasureUuids.strata = mapping.strata;
            console.log('adding mapping: ' + mapping.strata);
          }
        });
      }
    });
}

/**
 * Will add extra metadata to CPC+ measures
 * @param {array} measures
 */
function enrichCPCPlusMeasures(measures) {
  measures
    .filter(measure => measure.category === QUALITY_CATEGORY)
    .forEach(measure => {
      Object.keys(cpcPlusGroups).forEach((groupId) => {
        const match = cpcPlusGroups[groupId].find((id) => id === measure.eMeasureId);
        if (match !== undefined) {
          measure.cpcPlusGroup = groupId;
        }
      });
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
      if (qppItem.category !== QUALITY_CATEGORY || _.isNull(qppItem.eMeasureId) || qppItem.measureId !== currentMeasureId) return;
      measures[qppIndex].strata.forEach(function(measureStrata, strataIndex) {
        if (_.get(measureStrata, 'eMeasureUuids.numeratorUuid') &&
            measureStrata.eMeasureUuids.numeratorUuid === currentNumeratorUuid) {
          measures[qppIndex].strata[strataIndex].name = currentStrataName;
        }
      });
    });
  });
}

/**
 * Adds performance and eligibility options for claims-related measures.
 *
 * The source for this is a JSON file generated by /claims-related/scripts/single_source_to_json.py
 * See /claims-related/README.md for more information.
 */
function enrichClaimsRelatedMeasures(measures) {
  // these are the attributes we are interested in
  const attributes = [
    'eligibilityOptions',
    'performanceOptions'
  ];

  // to avoid nested iteration, let's sort claims related measures by their measure ID
  const claimsRelatedMeasures = JSON.parse(fs.readFileSync(path.join(__dirname, qppSingleSourceJson)));

  // now for each measure, add the attributes from the claims-related measures set
  measures.forEach(measure => {
    // if the measure is in claimsRelatedMeasures, we need to merge its attributes
    const claimsRelatedMeasure = claimsRelatedMeasures[measure.measureId];
    if (claimsRelatedMeasure) {
      for (const attribute of attributes) {
        measure[attribute] = claimsRelatedMeasure[attribute];
      }
    }
  });
}
