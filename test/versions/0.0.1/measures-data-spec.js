var chai = require('chai');
var assert = chai.assert;
var _ = require('lodash');
var mipsDataFormat = require('../../../index.js');
var measuresData = mipsDataFormat.getMeasuresData('0.0.1');

describe('measures data json', function() {
  var measureIds = _.map(measuresData, 'measureId');

  describe('pre-aci attestations', function() {
    var measureIdsSet = new Set(measureIds);
    var requiredAttestationIdsSet = new Set(['ACI_INFBLO_1', 'ACI_ONCDIR_1', 'ACI_ONCACB_1', 'ACI_IACEHRT_1']);

    it('includes all the pre-aci attestations', function() {
      var intersection = new Set([...measureIdsSet].filter(x => requiredAttestationIdsSet.has(x)));
      assert.equal(intersection.size, requiredAttestationIdsSet.size);
    });
  });

  // TODO(aimee): Add validat-data.js functionality here.
});
