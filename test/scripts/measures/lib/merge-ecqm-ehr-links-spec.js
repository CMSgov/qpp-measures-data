const { expect } = require('chai');
const mergeEcqmEhrLinks = require('../../../../scripts/measures/lib/merge-ecqm-ehr-links');

describe('merge-ecqm-ehr-links', () => {
  it('should merge ecqmEhrLinks into base measures data', () => {
    const measures = [
      { eMeasureId: '0', measureSpecification: {} },
      { eMeasureId: '1', measureSpecification: {} },
      { eMeasureId: '2', measureSpecification: {} }
    ];
    const ecqmEhrLinks = [
      { eMeasureId: '0', link: 'https://some.link/0' },
      { eMeasureId: '1', link: 'https://some.link/1' }
    ];
    const expectedMeasures = [
      { eMeasureId: '0', measureSpecification: { electronicHealthRecord: 'https://some.link/0' } },
      { eMeasureId: '1', measureSpecification: { electronicHealthRecord: 'https://some.link/1' } },
      { eMeasureId: '2', measureSpecification: {} }
    ];

    mergeEcqmEhrLinks(measures, ecqmEhrLinks);
    expect(measures).to.deep.equal(expectedMeasures);
  });

  it('should not mutate base measures if measure(s) are not found', () => {
    const measures = [
      { measureId: '0' },
      { measureId: '1' }
    ];
    const ecqmEhrLinks = [
      { eMeasureId: '0', link: 'https://some.link/0' },
      { eMeasureId: '1', link: 'https://some.link/1' }
    ];
    const expectedMeasures = [
      { measureId: '0' },
      { measureId: '1' }
    ];

    mergeEcqmEhrLinks(measures, ecqmEhrLinks);
    expect(measures).to.deep.equal(expectedMeasures);
  });
});
