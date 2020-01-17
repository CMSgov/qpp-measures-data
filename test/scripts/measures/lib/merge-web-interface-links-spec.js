const { expect } = require('chai');
const mergeWebInterfaceLinks = require('../../../../scripts/measures/lib/merge-web-interface-links');

describe('merge-web-interface-links', () => {
  it('should merge webInterfaceLinks into base measures data', () => {
    const measures = [
      { measureId: '0', measureSpecification: {} },
      { measureId: '1', measureSpecification: {} },
      { measureId: '2', measureSpecification: {} }
    ];
    const webInterfaceLinks = [
      { measureId: '0', link: 'https://some.link/0' },
      { measureId: '1', link: 'https://some.link/1' }
    ];
    const expectedMeasures = [
      { measureId: '0', measureSpecification: { cmsWebInterface: 'https://some.link/0' } },
      { measureId: '1', measureSpecification: { cmsWebInterface: 'https://some.link/1' } },
      { measureId: '2', measureSpecification: {} }
    ];

    mergeWebInterfaceLinks(measures, webInterfaceLinks);
    expect(measures).to.deep.equal(expectedMeasures);
  });

  it('should not mutate base measures if measure(s) are not found', () => {
    const measures = [
      { measureId: '0' },
      { measureId: '1' }
    ];
    const webInterfaceLinks = [
      { measureId: '1111', link: 'https://some.link/0' },
      { measureId: '2222', link: 'https://some.link/1' }
    ];
    const expectedMeasures = [
      { measureId: '0' },
      { measureId: '1' }
    ];

    mergeWebInterfaceLinks(measures, webInterfaceLinks);
    expect(measures).to.deep.equal(expectedMeasures);
  });
});
