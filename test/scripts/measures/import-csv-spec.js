// Libraries
const chai = require('chai');
const assert = chai.assert;
const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');

// The function
const importCsv = require('./../../../scripts/import-csv');

// Test data
const testMeasures = require('./test-measures.json');
const testConfig = YAML.load(path.join(__dirname, 'test-csv-config.yaml'));
const testCsv = fs.readFileSync(path.join(__dirname, 'test-qcdr.csv'));

describe('import-csv', function() {
  it.only('should append new measures to original measures', () => {
    const updatedMeasures = importCsv(testMeasures, testCsv, testConfig);
    assert.equal(updatedMeasures.length, 4);
  });

  it('should overwrite fields with the right csv data', () => {

  });

  it('should use identified constant fields', () => {

  });

  // describe('errors')
});
