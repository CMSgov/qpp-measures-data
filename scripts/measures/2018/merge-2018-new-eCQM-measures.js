// this script merges the util/measures/quality-performance-rates.json,
// util/measures/quality-measures-additional-info.json, and the measures from stdin
// into a new file that has more info about each performance strata
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const aciRelations = require('../../../../util/measures/aci-measure-relations.json');

let updatedMeasures = '';

process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    updatedMeasures += chunk;
  }
});

process.stdin.on('end', () => {
  process.stdout.write(mergeQpp(JSON.parse(updatedMeasures, 'utf8')));
});

function updateMeasureDataJson(updatedMeasures) {
  // read in tmp/quality-performance-rates.json
  let measureDataJsonFile = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../measures/2017/measures-data.json'), 'utf8'));

  // iterate through all updatedMeasures measures and find matching items from other json blobs
  //  "eMeasureId": "CMS52v6",
  //      "eMeasureUuid": "40280382-5abd-fa46-015b-49b9e72038f0",
  //      "strata": [
  //        {
  //          "description": "Patients who were prescribed Pneumocystis jiroveci pneumonia (PCP) prophylaxis within 3 months of CD4 count below 200 cells/mm3",
  //          "eMeasureUuids": {
  //            "initialPopulationUuid": "9961385E-AD3C-48F1-98EC-C41C194EAEEB",
  //            "denominatorUuid": "880FA69B-496A-4598-A49C-DA5AE7ADAADC",
  //            "numeratorUuid": "2C3BF41C-8561-48E5-81E0-39DF94F069A6",
  //            "denominatorExceptionUuid": "61A8AF15-0DE6-4A77-9FC9-03646E859967",
  //            "denominatorExclusionUuid": "F3CE1536-5D37-403E-A5EC-E80BBA76C512"
  //          }
  //        }

  //Loop through strata:
  //Update eMeasureId
  //Replace matching measure id's measure-data.json strata[*].description and strata[*].eMeasureUuids with updated file.
  measureDataJsonFile.forEach(function(measureItem, index) {
    if (measureItem.category === 'quality') {
      const  = _.find(updatedMeasures, {'qualityId': measureItem.measureId});

      if (!performanceRateDescription) {
        return measuresNotFound.push(measureItem.measureId);
      }

      const strataDetails = [];
      performanceRateDescription.descriptions.forEach(function(description, index) {
        strataDetails.push({description: description, name: performanceRateInfo.performanceRates[index]});
      });

      updatedMeasures[index].strata = strataDetails;
      updatedMeasures[index].overallAlgorithm = performanceRateInfo.overallAlgorithm;

      if (performanceRateInfo.metricType) {
        updatedMeasures[index].metricType = performanceRateInfo.metricType;
      }
    }
  });

  // Almost all eCQM measure and strata UUIDs as well as strata descriptions can be extracted from source XML files (with two exceptions which are handled below).
  // scripts/get-strata-and-uuids-from-ecqm-zip.js produces the generated-ecqm-data.json file which is integrated into measures-data below.
  const generatedEcqmStrataJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../util/measures/generated-ecqm-data.json'), 'utf8'));

  updatedMeasures.forEach(function(measureItem, index) {
    if (measureItem.category !== 'quality') return;
    const ecqmInfo = _.find(generatedEcqmStrataJson, {'eMeasureId': measureItem.eMeasureId});
    if (!ecqmInfo) return;

    updatedMeasures[index].eMeasureUuid = ecqmInfo.eMeasureUuid;
    updatedMeasures[index].metricType = ecqmInfo.metricType;
    const oldStrata = updatedMeasures[index].strata;

    // if none, just set it
    if (oldStrata.length === 0) {
      updatedMeasures[index].strata = ecqmInfo.strata;
    } else { // only override description, uuids
      ecqmInfo.strata.forEach((newStratum, ecqmIndex) => {
        if (oldStrata[ecqmIndex]) {
          updatedMeasures[index].strata[ecqmIndex].eMeasureUuids = newStratum.eMeasureUuids;
          updatedMeasures[index].strata[ecqmIndex].description = newStratum.description;
        } else {
          updatedMeasures[index].strata[ecqmIndex] = newStratum;
        }
      });
      if (oldStrata.length > 1) {
        // ASSUMPTION: strata already available are in the same order as the ones extracted from the xml files
        // @kencheeto: CMS156v5 is the only one that has more than one stratum and the ordering is correct
        console.warn(measureItem.eMeasureId, ': we are not guaranteed the same ordering, please double check these strata values in the diff');
      }
    }
  });

  // There are two measures (CMS145v5 and CMS160v5) whose source XML files from the zip mentioned above don't have a programmatically parseable format for UUID/description extraction. Also, strata names for almost all eCQM measures need to be manually created.
  // scripts/find-ecqms-with-missing-data.js produces the manually-added-ecqm-data.json file, which has been manually edited with the correct strata names and hardcoded info for 145v5 and 160v5.
  const manuallyAddedEcqmStrataJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../util/measures/manually-added-ecqm-data.json'), 'utf8'));

  updatedMeasures.forEach(function(measureItem, index) {
    if (measureItem.category !== 'quality') return;
    const ecqmInfo = _.find(manuallyAddedEcqmStrataJson, {'eMeasureId': measureItem.eMeasureId});
    if (!ecqmInfo) return;

    if (ecqmInfo.overallAlgorithm) {
      updatedMeasures[index].overallAlgorithm = ecqmInfo.overallAlgorithm;
    }

    if (ecqmInfo.metricType) {
      updatedMeasures[index].metricType = ecqmInfo.metricType;
    }

    if (['CMS145v5', 'CMS160v5'].includes(measureItem.eMeasureId)) {
      updatedMeasures[index].strata = ecqmInfo.strata;
      updatedMeasures[index].eMeasureUuid = ecqmInfo.eMeasureUuid;
    } else {
      // strata length in both files should match now
      ecqmInfo.strata.forEach((newStratum, ecqmIndex) => {
        updatedMeasures[index].strata[ecqmIndex].name = newStratum.name;
      });
    }
  });

  console.error('did not find measure details for the following', measuresNotFound);

  enrichACIMeasures(updatedMeasures);

  return JSON.stringify(updatedMeasures, null, 2);
}

/**
 * Will add extra metadata to ACI measure that are not directly available
 * in machine inferable format at https://qpp.cms.gov/api/v1/aci_measures
 * After this function executes, an ACI measure will have reporting category and substitutes.
 *  - substitutes: contains other measures that surrogates of a given measure.
 *  - reportingCategory: corresponds to the measure performance category
 * @param measures - the measures to enrich
 */
function enrichACIMeasures(measures) {
  // add extra ACI metadata to ACI measure
  measures
    .filter(measure => measure.category === 'aci')
    .forEach(measure => {
      // find the relation and populate reporting category and substitutions
      const aciRelation = aciRelations[measure.measureId];
      if (aciRelation) {
        measure.reportingCategory = aciRelation.reportingCategory;
        measure.substitutes = aciRelation.substitutes;
      }
    });
}
