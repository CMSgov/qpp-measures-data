const _ = require('lodash');
const chai = require('chai');
const path = require('path');
const YAML = require('yamljs');

const assert = chai.assert;

const Constants = require('../../constants.js');
const ValidateLib = require('../../scripts/validate-json-data/validate-json-data-lib');

describe('measures schema validates json', function() {
  const performanceYears = Constants.validPerformanceYears;

  for (const year of performanceYears) {
    describe(year + ' measures-data.json', function() {
      let schema;
      let data;

      before(() => {
        schema = YAML.load(path.join(__dirname, '../../', 'measures', year.toString(), 'measures-schema.yaml'));
        data = require(path.join(__dirname, '../../', 'measures', year.toString(), 'measures-data.json'));
      });

      it('matches the schema', () => {
        const {valid} = ValidateLib.validate(schema, data);
        assert.isTrue(valid);
      });

      // For 2019+ verify that the schema is strict about additional properties
      if (year >= 2019) {
        it('fails if the measures contain an additional property not present in the schema', () => {
          // Add an additional field
          const changedData = _.cloneDeep(data);
          changedData[0].additionalField = true;

          const {valid} = ValidateLib.validate(schema, changedData);
          assert.isFalse(valid);
        });
      }
    });
  }
});
