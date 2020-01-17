const { expect } = require('chai');
const mergePiLinks = require('../../../../scripts/measures/lib/merge-pi-links');

describe('merge-pi-links', () => {
  it('should merge piLinks into base measures data', () => {
    const measures = [
      { measureId: '0', measureSpecification: {} },
      { measureId: '1', measureSpecification: {} },
      { measureId: '2', measureSpecification: {} }
    ];
    const piLinks = [
      { measureId: '0', link: 'https://some.link/0' },
      { measureId: '1', link: 'https://some.link/1' }
    ];
    const expectedMeasures = [
      { measureId: '0', measureSpecification: { default: 'https://some.link/0' } },
      { measureId: '1', measureSpecification: { default: 'https://some.link/1' } },
      { measureId: '2', measureSpecification: {} }
    ];

    mergePiLinks(measures, piLinks);
    expect(measures).to.deep.equal(expectedMeasures);
  });

  it('should create measureSpecification.default path if it does not exist', () => {
    const measures = [
      { measureId: '0' },
      { measureId: '1' }
    ];
    const piLinks = [
      { measureId: '0', link: 'https://some.link/0' },
      { measureId: '1', link: 'https://some.link/1' }
    ];
    const expectedMeasures = [
      { measureId: '0', measureSpecification: { default: 'https://some.link/0' } },
      { measureId: '1', measureSpecification: { default: 'https://some.link/1' } }
    ];

    mergePiLinks(measures, piLinks);
    expect(measures).to.deep.equal(expectedMeasures);
  });

  it('should not mutate base measures if measure(s) are not found', () => {
    const measures = [
      { measureId: '0' },
      { measureId: '1' }
    ];
    const piLinks = [
      { measureId: '1111', link: 'https://some.link/0' },
      { measureId: '2222', link: 'https://some.link/1' }
    ];
    const expectedMeasures = [
      { measureId: '0' },
      { measureId: '1' }
    ];

    mergePiLinks(measures, piLinks);
    expect(measures).to.deep.equal(expectedMeasures);
  });
});
