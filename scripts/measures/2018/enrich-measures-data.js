const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const parse = require('csv-parse/lib/sync');

const currentYear = 2018;
const piRelations = require('../../../util/measures/' + currentYear + '/pi-measure-relations.json');
const cpcPlusGroups = require('../../../util/measures/' + currentYear + '/cpc+-measure-groups.json');
const stratifications = require('../../../util/measures/2018/additional-stratifications.json');

const QUALITY_CATEGORY = 'quality';
const measuresDataPath = process.argv[2];
const outputPath = process.argv[3];
const qpp = fs.readFileSync(path.join(__dirname, measuresDataPath), 'utf8');
fs.writeFileSync(path.join(__dirname, outputPath), enrichMeasures(JSON.parse(qpp)));

function enrichMeasures(measures) {
  enrichPIMeasures(measures);
  enrichCPCPlusMeasures(measures);
  enrichInverseMeasures(measures);
  mergeGeneratedEcqmData(measures);
  enrichStratifications(measures);
  addQualityStrataNames(measures);
  addRequiredRegistrySubmissionMethod(measures);
  enrichClaimsRelatedMeasures(measures);
  return JSON.stringify(measures, null, 2);
}

/**
 * Will add extra metadata to PI measure that are not directly available
 * in machine inferable format at https://qpp.cms.gov/api/v1/aci_measures
 * After this function executes, an PI measure will have reporting category and substitutes.
 *  - substitutes: contains other measures that surrogates of a given measure.
 *  - reportingCategory: corresponds to the measure performance category
 * @param measures - the measures to enrich
 */
function enrichPIMeasures(measures) {
  // add extra PI metadata to PI measure
  measures
    .filter(measure => measure.category === 'pi')
    .forEach(measure => {
      // find the relation and populate reporting category and substitutions
      const piRelation = piRelations[measure.measureId];
      if (piRelation) {
        measure.reportingCategory = piRelation.reportingCategory;
        measure.substitutes = piRelation.substitutes;
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

/**
 * Add `isInverse` attribute to measures based on inverse-measures.json
 * The JSON document used to derive this is generated using get-inverse-measures-from-pdfs.js
 */
function enrichInverseMeasures(measures) {
  const inverseMeasures = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../util/measures/2017/inverse-measures.json')));
  measures.forEach(measure => {
    if (inverseMeasures.hasOwnProperty(measure.measureId)) {
      measure.isInverse = inverseMeasures[measure.measureId];
    }
  });
}

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
    measures[index].eMeasureUuid = ecqmInfo.eMeasureUuid;
    measures[index].metricType = ecqmInfo.metricType;
    measures[index].strata = ecqmInfo.strata;
  });

  // This is a manually created file from from the eCQM_EP_EC_May2017.zip for the 4 missing measures.
  const manuallyAddedEcqmStrataJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../util/measures/2018/manually-created-missing-measures.json'), 'utf8'));
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

/**
 * Adds in each SubPopulation's stratification UUIDs
 * This JSON document used to derive this is generated using get-stratifications.js
 * Still uses 2017 additional stratifications from 2017. This is subject to change.
 */
function enrichStratifications(measures) {
  measures
    .filter(measure => measure.category === QUALITY_CATEGORY)
    .forEach(measure => {
      const stratification = stratifications.find(stratum => stratum.eMeasureId === measure.eMeasureId);
      if (stratification && stratification.strataMaps) {
        measure.strata.forEach(subPopulation => {
          const mapping = stratification.strataMaps.find(map =>
            map.numeratorUuid === subPopulation.eMeasureUuids.numeratorUuid);
          if (mapping) {
            subPopulation.eMeasureUuids.strata = mapping.strata;
          }
        });
      }
    });
}

/*
 * Uses numeratorUuid field as a common id to map each strata name (only in `enriched-measures-data-quality.json`)
 * to a particular strata (in `quality-strata.csv`)
 */
function addQualityStrataNames(measures) {
  const qualityStrataCsv = parse(fs.readFileSync(path.join(__dirname, '../../../util/measures/2018/quality-strata.csv'), 'utf8'));
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
  const claimsRelatedMeasures = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../claims-related/data/qpp-single-source-2018.json')));

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
