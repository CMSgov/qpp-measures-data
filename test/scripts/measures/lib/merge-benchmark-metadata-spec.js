const {expect} = require('chai');
const mergeBenchmarkMetadata = require('../../../../scripts/measures/lib/archive/merge-benchmark-metadata');

describe('merge-benchmark-metadata', () => {
  it('should merge benchmark metadata into base measure data', () => {
    const measures = [
      {measureId: '0', measureSpecification: {}},
      {measureId: '1', measureSpecification: {}},
      {measureId: '2', measureSpecification: {}}
    ];
    const metadata = [
      { measureId: '1',
        claimsTruncated: 'N',
        certifiedSurveyVendorTruncated: 'N',
        electronicHealthRecordTruncated: 'N',
        cmsWebInterfaceTruncated: 'N',
        administrativeClaimsTruncated: 'N',
        registryTruncated: 'N',
        claimsSuppressed: 'N',
        certifiedSurveyVendorSuppressed: 'N',
        electronicHealthRecordSuppressed: 'Y',
        cmsWebInterfaceSuppressed: 'Y',
        administrativeClaimsSuppressed: 'N',
        registrySuppressed: 'N',
        claimsRemoved: 'Y',
        certifiedSurveyVendorRemoved: 'N',
        electronicHealthRecordRemoved: 'N',
        cmsWebInterfaceRemoved: 'N',
        administrativeClaimsRemoved: 'N',
        registryRemoved: 'N',
        claimsFlat: 'N',
        certifiedSurveyVendorFlat: 'N',
        electronicHealthRecordFlat: 'N',
        cmsWebInterfaceFlat: 'N',
        administrativeClaimsFlat: 'N',
        registryFlat: 'N'
      },
      { measureId: '2',
        claimsTruncated: 'Y',
        certifiedSurveyVendorTruncated: 'N',
        electronicHealthRecordTruncated: 'N',
        cmsWebInterfaceTruncated: 'N',
        administrativeClaimsTruncated: 'N',
        registryTruncated: 'N',
        claimsSuppressed: 'N',
        certifiedSurveyVendorSuppressed: 'N',
        electronicHealthRecordSuppressed: 'N',
        cmsWebInterfaceSuppressed: 'N',
        administrativeClaimsSuppressed: 'N',
        registrySuppressed: 'N',
        claimsRemoved: 'N',
        certifiedSurveyVendorRemoved: 'N',
        electronicHealthRecordRemoved: 'N',
        cmsWebInterfaceRemoved: 'N',
        administrativeClaimsRemoved: 'N',
        registryRemoved: 'Y',
        claimsFlat: 'N',
        certifiedSurveyVendorFlat: 'Y',
        electronicHealthRecordFlat: 'N',
        cmsWebInterfaceFlat: 'N',
        administrativeClaimsFlat: 'N',
        registryFlat: 'N'
      }
    ];
    const expectedMeasures = [
      {measureId: '0', measureSpecification: {}},
      {measureId: '1', measureSpecification: {}, isIcdImpacted: false, icdImpacted: [], isClinicalGuidelineChanged: true, clinicalGuidelineChanged: ['electronicHealthRecord', 'cmsWebInterface'], historic_benchmarks: { claims: 'removed' }},
      {measureId: '2', measureSpecification: {}, isIcdImpacted: true, icdImpacted: ['claims'], isClinicalGuidelineChanged: false, clinicalGuidelineChanged: [], historic_benchmarks: {registry: 'removed'}}
    ];

    mergeBenchmarkMetadata(measures, metadata, true);
    expect(measures).to.deep.equal(expectedMeasures);
  });

  it('should not mutate base measures if measure(s) are not found', () => {
    const measures = [
      {measureId: '0'},
      {measureId: '1'}
    ];
    const metadata = [
      { measureId: 3,
        claimsTruncated: 'N',
        certifiedSurveyVendorTruncated: 'N',
        electronicHealthRecordTruncated: 'N',
        cmsWebInterfaceTruncated: 'N',
        administrativeClaimsTruncated: 'N',
        registryTruncated: 'N',
        claimsSuppressed: 'N',
        certifiedSurveyVendorSuppressed: 'N',
        electronicHealthRecordSuppressed: 'Y',
        cmsWebInterfaceSuppressed: 'Y',
        administrativeClaimsSuppressed: 'N',
        registrySuppressed: 'N',
        claimsRemoved: 'Y',
        certifiedSurveyVendorRemoved: 'N',
        electronicHealthRecordRemoved: 'N',
        cmsWebInterfaceRemoved: 'N',
        administrativeClaimsRemoved: 'N',
        registryRemoved: 'N',
        claimsFlat: 'N',
        certifiedSurveyVendorFlat: 'N',
        electronicHealthRecordFlat: 'N',
        cmsWebInterfaceFlat: 'N',
        administrativeClaimsFlat: 'N',
        registryFlat: 'N'
      }
    ];
    const expectedMeasures = [
      {measureId: '0'},
      {measureId: '1'}
    ];

    mergeBenchmarkMetadata(measures, metadata);
    expect(measures).to.deep.equal(expectedMeasures);
  });

  it('should not merge benchmark metadata into base measure data', () => {
    const measures = [
      {measureId: '0', measureSpecification: {}},
      {measureId: '1', measureSpecification: {}}
    ];
    const metadata = [
      { measureId: '1',
        claimsTruncated: 'N',
        certifiedSurveyVendorTruncated: 'N',
        electronicHealthRecordTruncated: 'N',
        cmsWebInterfaceTruncated: 'N',
        administrativeClaimsTruncated: 'N',
        registryTruncated: 'N',
        claimsSuppressed: 'N',
        certifiedSurveyVendorSuppressed: 'N',
        electronicHealthRecordSuppressed: 'Y',
        cmsWebInterfaceSuppressed: 'Y',
        administrativeClaimsSuppressed: 'N',
        registrySuppressed: 'N',
        claimsRemoved: 'Y',
        certifiedSurveyVendorRemoved: 'N',
        electronicHealthRecordRemoved: 'N',
        cmsWebInterfaceRemoved: 'N',
        administrativeClaimsRemoved: 'N',
        registryRemoved: 'N',
        claimsFlat: 'N',
        certifiedSurveyVendorFlat: 'N',
        electronicHealthRecordFlat: 'N',
        cmsWebInterfaceFlat: 'N',
        administrativeClaimsFlat: 'N',
        registryFlat: 'N'
      }
    ];
    const expectedMeasures = [
      {measureId: '0', measureSpecification: {}},
      {measureId: '1', measureSpecification: {}, isIcdImpacted: false, icdImpacted: [], isClinicalGuidelineChanged: true, clinicalGuidelineChanged: ['electronicHealthRecord', 'cmsWebInterface']}
    ];

    mergeBenchmarkMetadata(measures, metadata);
    expect(measures).to.deep.equal(expectedMeasures);
  });
});
