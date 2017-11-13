const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');

const aciRelations = require('../../util/measures/aci-measure-relations.json');
const cpcPlusGroups = require('../../util/measures/cpc+-measure-groups.json');

const measuresDataPath = process.argv[2];
const outputPath = process.argv[3];
const qpp = fs.readFileSync(path.join(__dirname, measuresDataPath), 'utf8');
fs.writeFileSync(path.join(__dirname, outputPath), enrichMeasures(JSON.parse(qpp)));

function enrichMeasures(measures) {
  enrichACIMeasures(measures);
  enrichCPCPlusMeasures(measures);
  enrichAddMeasuresSpecification(measures);
  enrichInverseMeasures(measures);
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
      const aciRelation = aciRelations[measure.measureId];
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
        const match = cpcPlusGroups[groupId].find((id) => id === measure.eMeasureId);
        if (match !== undefined) {
          measure.cpcPlusGroup = groupId;
        }
      });
    });
};

/**
 * Will add measureSpecification links and it's submission method types to measures.
 * @param {array} measures
 */
function enrichAddMeasuresSpecification(measures) {
  const csv = parse(fs.readFileSync(path.join(__dirname, '../../util/measures/measurePDF-Specification.csv'), 'utf8'));
  const mappedLinks = csv.reduce(function(acc, [submissionMethod, measureId, link]) {
    acc[measureId] = acc[measureId] || {};
    acc[measureId][submissionMethod] = link;
    return acc;
  }, {});
  const measureData = measures.map(function(measure) {
    measure.measureSpecification = mappedLinks[measure.measureId];
    return measure;
  });
  return measureData;
};

/**
 * Add `isInverse` attribute to measures based on inverse-measures.json
 * The JSON document used to derive this is generated using get-inverse-measures-from-pdfs.js
 */
function enrichInverseMeasures(measures) {
  const inverseMeasures = JSON.parse(fs.readFileSync(path.join(__dirname, '../../util/measures/inverse-measures.json')));
  measures.forEach(measure => {
    if (inverseMeasures.hasOwnProperty(measure.measureId)) {
      measure.isInverse = inverseMeasures[measure.measureId];
    }
  });
}
