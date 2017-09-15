const fs = require('fs');
const path = require('path');

const aciRelations = require('../../util/measures/aci-measure-relations.json');
const cpcPlusGroups = require('../../util/measures/cpc+-measure-groups.json');

const qpp = fs.readFileSync(path.join(__dirname, '../../staging/measures-data.json'), 'utf8');
fs.writeFileSync(path.join(__dirname, '../../measures/measures-data.json'), enrichMeasures(JSON.parse(qpp)));

function enrichMeasures(measures) {
  enrichACIMeasures(measures);
  enrichCPCPlusMeasures(measures);
  return JSON.stringify(measures, null, 2);
};

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
      var aciRelation = aciRelations[measure.measureId];
      if (aciRelation) {
        measure.reportingCategory = aciRelation.reportingCategory;
        measure.substitutes = aciRelation.substitutes;
      }
    });
}

/**
 * Will add extra metadata to CPC+ measures
 * @param {array} measures
 */
function enrichCPCPlusMeasures(measures) {
  measures
    .filter(measure => measure.category === 'quality')
    .forEach(measure => {
      Object.keys(cpcPlusGroups).forEach((groupId) => {
        var match = cpcPlusGroups[groupId].find((id) => id === measure.eMeasureId);
        if (match !== undefined) {
          measure.cpcPlusGroup = groupId;
        }
      });
    });
};
