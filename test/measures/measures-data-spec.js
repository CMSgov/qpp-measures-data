var chai = require('chai');
var assert = chai.assert;
var _ = require('lodash');

var mipsDataFormat = require('../../index.js');
var measuresData = mipsDataFormat.getMeasuresData();

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
  });

  describe('quality measures', function() {
    it('includes all quality measures with mutli-performance strata', function() {
      var multiPerformanceIds = new Set(['007', '046', '122', '238', '348', '391', '392', '394', '398']);
      var qualityMeasureIds = _.map(_.filter(measuresData, {category: 'quality'}), 'measureId');
      var intersection = new Set([...qualityMeasureIds].filter(x => multiPerformanceIds.has(x)));

      assert.equal(intersection.size, multiPerformanceIds.size);
    });

    describe('CAHPS measures', function() {
      const cahpsMeasures = measuresData.filter(function(measure) {
        var re = /CAHPS_\d+/i;
        return measure.measureId.match(re) !== null;
      });
      const numCahpsMeasures = cahpsMeasures.length;

      function testExpectedField(fieldName, expectedFieldValue, measuresToTest, numExpected) {
        var numExpected = numExpected || numCahpsMeasures;
        var measuresToTest = measuresToTest || cahpsMeasures;
        var fieldValues = measuresToTest.map((measure) => measure[fieldName]);
        assert.deepEqual(fieldValues, Array(numExpected).fill(expectedFieldValue));
      }

      it('includes 12 cahps measures', function() {
        assert.equal(numCahpsMeasures, 12);
      });

      it('are all floats', () => testExpectedField('metricType', 'float'));
      it('all have measureType \'patientEngagementExperience\'', () => testExpectedField('measureType', 'patientEngagementExperience'));
      it('all have primarySteward \'Agency for Healthcare Research & Quality\'', () => testExpectedField('primarySteward', 'Agency for Healthcare Research & Quality'));
      it('all have submissionMethods \'certifiedSurveyVendor\'', () => testExpectedField('submissionMethods', ['certifiedSurveyVendor']));
      it('all have measureSets \'generalPracticeFamilyMedicine\'', () => testExpectedField('measureSets', ['generalPracticeFamilyMedicine']));
      it('some have nqfId 0005', function() {
        var nqfIdMeasures = cahpsMeasures.filter((measure) => measure.nqfId !== null);
        var expectedNqfIdMeasuresLength = 4;
        testExpectedField('nqfId', '0005', nqfIdMeasures, expectedNqfIdMeasuresLength);
      });
    });
  });
});
