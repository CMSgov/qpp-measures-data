var chai = require('chai');
var assert = chai.assert;
var _ = require('lodash');

var mipsDataFormat = require('../../index.js');
var measuresData = mipsDataFormat.getMeasuresData();
var actualAciRelation = require('../../util/aci-measure-relations.json');

describe('measures data json', function() {
  var measureIds = _.map(measuresData, 'measureId');

  it('should not have any duplicate measureIds', function() {
    assert.equal(_.uniq(measureIds).length, measureIds.length);
  });

  describe('pre-aci attestations', function() {
    var measureIdsSet = new Set(measureIds);
    var requiredAttestationIdsSet = new Set(['ACI_INFBLO_1', 'ACI_ONCDIR_1', 'ACI_ONCACB_1', 'ACI_IACEHRT_1']);

    it('includes all the pre-aci attestations', function() {
      var intersection = new Set([...measureIdsSet]
        .filter(x => requiredAttestationIdsSet.has(x)));
      assert.equal(intersection.size, requiredAttestationIdsSet.size);
    });

    it('does not have substitutes', () => {
      requiredAttestationIdsSet.forEach(measureId => {
        var measure = measuresData.find(m => m.measureId === 'ACI_INFBLO_1');
        assert.isTrue(_.isEmpty(measure.substitutes));
      });
    });
  });

  describe('ACI measures have proper substitutions', () => {
    it('ACI_PHCDRR_1 should be in performanceBonus reporting category', () => {
      var measure = measuresData.find(m => m.measureId === 'ACI_PHCDRR_1');
      assert.equal(measure.reportingCategory, 'performanceBonus');
    });

    it('ACI_TRANS_PHCDRR_2 should contain correct substitutes', () => {
      var measure = measuresData.find(m => m.measureId === 'ACI_TRANS_PHCDRR_2');
      assert.deepEqual(measure.substitutes, ['ACI_PHCDRR_2']);
    });

    it('dose contain proper metadata on all measures', () => {
      var generated = {};
      measuresData
        .filter(m => m.category === 'aci')
        .forEach(m => {
          generated[m.measureId] = {reportingCategory: m.reportingCategory, substitutes: m.substitutes};
        });
      assert.deepEqual(generated, actualAciRelation);
    });
  });

  describe('quality measures', function() {
    it('includes all quality measures with mutli-performance strata', function() {
      var multiPerformanceIds = new Set(['007', '046', '122', '238', '348', '391', '392', '394', '398']);
      var qualityMeasureIds = _.map(_.filter(measuresData, {category: 'quality'}), 'measureId');
      var intersection = new Set([...qualityMeasureIds].filter(x => multiPerformanceIds.has(x)));

      assert.equal(intersection.size, multiPerformanceIds.size);
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
  });
});
