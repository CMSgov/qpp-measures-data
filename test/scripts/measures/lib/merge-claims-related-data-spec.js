const {expect} = require('chai');
const mergeClaimsLinks = require('../../../../scripts/measures/lib/merge-claims-related-data');

describe('merge-claims-related-data', () => {
  it('should merge claims-related-data into base measure data', () => {
    const measures = [
      {measureId: '0', measureSpecification: {}},
      {measureId: '1', measureSpecification: {}},
      {measureId: '2', measureSpecification: {}}
    ];
    const claimsData = {
      '0': {eligibilityOptions: ['eligibility_options1'], performanceOptions: ['performance_options1']},
      '2': {eligibilityOptions: ['eligibility_options2'], performanceOptions: ['performance_options2']}
    };
    const expectedMeasures = [
      {measureId: '0', measureSpecification: {}, eligibilityOptions: ['eligibility_options1'], performanceOptions: ['performance_options1']},
      {measureId: '1', measureSpecification: {}},
      {measureId: '2', measureSpecification: {}, eligibilityOptions: ['eligibility_options2'], performanceOptions: ['performance_options2']}
    ];

    mergeClaimsLinks(measures, claimsData);
    expect(measures).to.deep.equal(expectedMeasures);
  });

  it('should not mutate base measures if measure(s) are not found', () => {
    const measures = [
      {measureId: '0'},
      {measureId: '1'}
    ];
    const claimsData = {
      '3': {eligibilityOptions: ['eligibility_options1'], performanceOptions: ['performance_options1']},
      '2': {eligibilityOptions: ['eligibility_options2'], performanceOptions: ['performance_options2']}
    };
    const expectedMeasures = [
      {measureId: '0'},
      {measureId: '1'}
    ];

    mergeClaimsLinks(measures, claimsData);
    expect(measures).to.deep.equal(expectedMeasures);
  });
});
