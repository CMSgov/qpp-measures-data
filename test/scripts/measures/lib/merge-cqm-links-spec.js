const { expect } = require('chai');
const mergeCqmLinks = require('../../../../scripts/measures/lib/merge-cqm-links');

describe('merge-cqm-links', () => {
  it('should merge cqmLinks into base measure data', () => {
    const measures = [
      { measureId: '0', measureSpecification: {} },
      { measureId: '1', measureSpecification: {} },
      { measureId: '2', measureSpecification: {} }
    ];
    const cqmLinks = [
      { measureId: '0', link: 'https://some.link/0' },
      { measureId: '1', link: 'https://some.link/1' }
    ];
    const expectedMeasures = [
      { measureId: '0', measureSpecification: { registry: 'https://some.link/0' } },
      { measureId: '1', measureSpecification: { registry: 'https://some.link/1' } },
      { measureId: '2', measureSpecification: {} }
    ];

    mergeCqmLinks(measures, cqmLinks);
    expect(measures).to.deep.equal(expectedMeasures);
  });

  it('should not mutate base measures if measure(s) are not found', () => {
    const measures = [
      { measureId: '0' },
      { measureId: '1' }
    ];
    const cqmLinks = [
      { measureId: '1111', link: 'https://some.link/0' },
      { measureId: '2222', link: 'https://some.link/1' }
    ];
    const expectedMeasures = [
      { measureId: '0' },
      { measureId: '1' }
    ];

    mergeCqmLinks(measures, cqmLinks);
    expect(measures).to.deep.equal(expectedMeasures);
  });
});
