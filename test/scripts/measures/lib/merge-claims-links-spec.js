const { expect } = require('chai');
const mergeClaimsLinks = require('../../../../scripts/measures/lib/merge-claims-links');

describe('merge-claims-links', () => {
  it('should merge claimsLinks into base measure data', () => {
    const measures = [
      { measureId: '0', measureSpecification: {} },
      { measureId: '1', measureSpecification: {} },
      { measureId: '2', measureSpecification: {} }
    ];
    const claimsLinks = [
      { measureId: '0', link: 'https://some.link/0' },
      { measureId: '1', link: 'https://some.link/1' }
    ];
    const expectedMeasures = [
      { measureId: '0', measureSpecification: { claims: 'https://some.link/0' } },
      { measureId: '1', measureSpecification: { claims: 'https://some.link/1' } },
      { measureId: '2', measureSpecification: {} }
    ];

    mergeClaimsLinks(measures, claimsLinks);
    expect(measures).to.deep.equal(expectedMeasures);
  });

  it('should not mutate base measures if measure(s) are not found', () => {
    const measures = [
      { measureId: '0' },
      { measureId: '1' }
    ];
    const claimsLinks = [
      { measureId: '1111', link: 'https://some.link/0' },
      { measureId: '2222', link: 'https://some.link/1' }
    ];
    const expectedMeasures = [
      { measureId: '0' },
      { measureId: '1' }
    ];

    mergeClaimsLinks(measures, claimsLinks);
    expect(measures).to.deep.equal(expectedMeasures);
  });
});
