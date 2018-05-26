const chai = require('chai');
const assert = chai.assert;
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');

const year = 2018;
const mipsDataFormat = require('../../../index.js');
const actualMeasureSpecificationData = parse(fs.readFileSync(path.join(__dirname,
  '../../../util/measures/' + year + '/measurePDF-Specification.csv'), 'utf8'));

const measuresData = mipsDataFormat.getMeasuresData(year);

// When adding tests below, check the 2017/measures-data-spec.js for reusable
// test coverage-- e.g. when adding ACI (PI), CAHPS, or CPC+ measures for 2018.
describe(year + ' measures data json', function() {
  const measureIds = _.map(measuresData, 'measureId');

  it('should not have any duplicate measureIds', function() {
    assert.equal(_.uniq(measureIds).length, measureIds.length);
  });

  describe('pre-PI attestations', function() {
    const measureIdsSet = new Set(measureIds);
    const requiredAttestationIdsSet = new Set(['PI_INFBLO_1', 'PI_ONCDIR_1', 'PI_ONCACB_1', 'PI_IACEHRT_1']);

    it('includes all the pre-PI attestations', function() {
      const intersection = new Set([...measureIdsSet]
        .filter(x => requiredAttestationIdsSet.has(x)));
      assert.equal(intersection.size, requiredAttestationIdsSet.size);
    });

    it('does not have substitutes', () => {
      requiredAttestationIdsSet.forEach(measureId => {
        const measure = measuresData.find(m => m.measureId === 'PI_INFBLO_1');
        assert.isTrue(_.isEmpty(measure.substitutes));
      });
    });
  });

  describe('quality measures', function() {
    it('includes all quality measures with multi-performance strata', function() {
      const multiPerformanceIds = new Set(['007', '046', '122', '238', '348', '391', '392', '394', '398']);
      const qualityMeasureIds = _.map(_.filter(measuresData, {category: 'quality'}), 'measureId');
      const intersection = new Set([...qualityMeasureIds].filter(x => multiPerformanceIds.has(x)));

      assert.equal(intersection.size, multiPerformanceIds.size);
    });

    describe('Some measures have measureSpecification property', () => {
      it('contains proper metadata on measures', () => {
        const validMeasureIds = measuresData
          .filter(m => m.measureSpecification !== undefined)
          .map(m => m.measureId);
        const actual = actualMeasureSpecificationData.reduce(function(acc, [submissionMethod, measureId, link]) {
          if (validMeasureIds.includes(measureId)) {
            acc[measureId] = acc[measureId] || {};
            acc[measureId][submissionMethod] = link;
          }
          return acc;
        }, {});
        const generated = {};
        measuresData
          .filter(m => m.measureSpecification !== undefined)
          .forEach(m => {
            generated[m.measureId] = generated[m.measureId] || {};
            const submissionMethods = Object.keys(m.measureSpecification);
            submissionMethods.forEach((method) => {
              generated[m.measureId][method] = m.measureSpecification[method];
            });
          });
        assert.deepEqual(generated, actual);
      });
    });

    describe('eCQMeasures', () => {
      it('all eCQM measures permitting electronicHealthRecord submission method also permit registry submission method', () => {
        const eCQMeasures = measuresData.filter(m => m.eMeasureUuid !== undefined);
        eCQMeasures.forEach(m => {
          if (m.submissionMethods.includes('electronicHealthRecord')) {
            assert.isTrue(m.submissionMethods.includes('registry'));
          }
        });
      });
    });
  });
});
