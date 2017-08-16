const chai = require('chai');
const assert = chai.assert;
const _ = require('lodash');

const mipsDataFormat = require('../../index.js');
const measuresData = mipsDataFormat.getMeasuresData();
const actualAciRelation = require('../../util/measures/aci-measure-relations.json');
const actualCpcPlusGroups = require('../../util/measures/cpc+-measure-groups.json');

describe('measures data json', function() {
  const measureIds = _.map(measuresData, 'measureId');

  it('should not have any duplicate measureIds', function() {
    assert.equal(_.uniq(measureIds).length, measureIds.length);
  });

  describe('pre-aci attestations', function() {
    const measureIdsSet = new Set(measureIds);
    const requiredAttestationIdsSet = new Set(['ACI_INFBLO_1', 'ACI_ONCDIR_1', 'ACI_ONCACB_1', 'ACI_IACEHRT_1']);

    it('includes all the pre-aci attestations', function() {
      const intersection = new Set([...measureIdsSet]
        .filter(x => requiredAttestationIdsSet.has(x)));
      assert.equal(intersection.size, requiredAttestationIdsSet.size);
    });

    it('does not have substitutes', () => {
      requiredAttestationIdsSet.forEach(measureId => {
        const measure = measuresData.find(m => m.measureId === 'ACI_INFBLO_1');
        assert.isTrue(_.isEmpty(measure.substitutes));
      });
    });
  });

  describe('ACI measures have proper substitutions', () => {
    it('ACI_PHCDRR_1 should be in performanceBonus reporting category', () => {
      const measure = measuresData.find(m => m.measureId === 'ACI_PHCDRR_1');
      assert.equal(measure.reportingCategory, 'performanceBonus');
    });

    it('ACI_TRANS_PHCDRR_2 should contain correct substitutes', () => {
      const measure = measuresData.find(m => m.measureId === 'ACI_TRANS_PHCDRR_2');
      assert.deepEqual(measure.substitutes, ['ACI_PHCDRR_2']);
    });

    it('contains proper metadata on all measures', () => {
      const generated = {};
      measuresData
        .filter(m => m.category === 'aci')
        .forEach(m => {
          generated[m.measureId] = {reportingCategory: m.reportingCategory, substitutes: m.substitutes};
        });
      assert.deepEqual(generated, actualAciRelation);
    });
  });

  describe('quality measures', function() {
    it('includes all quality measures with multi-performance strata', function() {
      const multiPerformanceIds = new Set(['007', '046', '122', '238', '348', '391', '392', '394', '398']);
      const qualityMeasureIds = _.map(_.filter(measuresData, {category: 'quality'}), 'measureId');
      const intersection = new Set([...qualityMeasureIds].filter(x => multiPerformanceIds.has(x)));

      assert.equal(intersection.size, multiPerformanceIds.size);
    });

    it('properly handles the exclusion of certain submission methods', () => {
      const shouldNotAcceptCmsWebInterface = measuresData.filter(
        measure => ['001', '117'].includes(measure.measureId)
      );
      shouldNotAcceptCmsWebInterface.forEach(measure => {
        assert.isFalse(measure.submissionMethods.includes('cmsWebInterface'));
      });
    });

    describe('CAHPS measures', function() {
      it('contains 12 correct CAHPS measures', function() {
        const cahpsMeasures = measuresData.filter(measure => measure.measureId.match(/CAHPS_\d+/));
        const commonCahpsProperties = {
          'metricType': 'cahps',
          'measureType': 'patientEngagementExperience',
          'primarySteward': 'Agency for Healthcare Research & Quality',
          'submissionMethods': ['certifiedSurveyVendor'],
          'measureSets': ['generalPracticeFamilyMedicine'],
          'firstPerformanceYear': 2017,
          'category': 'quality',
          'isHighPriority': true,
          'isInverse': false
        };
        const nqfIdMap = {
          'CAHPS for MIPS SSM: Getting Timely Care, Appointments and Information': '0005',
          'CAHPS for MIPS SSM: How Well Providers Communicate': '0005',
          'CAHPS for MIPS SSM: Patient\'s Rating of Provider': '0005',
          'CAHPS for MIPS SSM: Courteous and Helpful Office Staff': '0005'
        };
        assert.equal(cahpsMeasures.length, 12);
        cahpsMeasures.forEach(cahpsMeasure => {
          assert.match(cahpsMeasure.title, /^CAHPS for MIPS/);
          // these are the same for all CAHPS measures
          assert.deepEqual(_.pick(cahpsMeasure, Object.keys(commonCahpsProperties)), commonCahpsProperties);
          if (nqfIdMap[cahpsMeasure.title]) {
            assert.equal(cahpsMeasure.nqfId, '0005');
          }
        });
      });
    });

    describe('Some quality measures belong to CPC+ groups', () => {
      it('MeasureId 309 should be in CPC+ group "C"', () =>
        const measure = measuresData.find(m => m.measureId === '309');
        assert.equal(measure.cpcPlusGroup, 'C');
      });

      it('contains proper metadata on all measures', () => {
        const generated = {};
        measuresData
          .filter(m => m.category === 'quality')
          .filter(m => m.cpcPlusGroup !== undefined)
          .forEach(m => {
            if (generated[m.cpcPlusGroup] === undefined) {
              generated[m.cpcPlusGroup] = [];
            }
            generated[m.cpcPlusGroup].push(m.cpcPlusGroup);
          });
          assert.deepEqual(generated, actualCpcPlusGroups);
      });
    });

  });
});
