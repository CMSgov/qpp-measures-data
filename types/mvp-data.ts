export interface MVPData {
    mvpId: string;
    clinicalTopic: string;
    title: string;
    description: string;
    specialtiesMostApplicableTo: string[];
    clinicalTopics: string;
    qualityMeasureIds: string[];
    iaMeasureIds: string[];
    costMeasureIds: string[];
    foundationPiMeasureIds: string[];
    foundationQualityMeasureIds: string[];
    administrativeClaimsMeasureIds: string[];
    hasCahps: boolean;
    hasOutcomeAdminClaims: boolean;
}

export interface MVPDataSlim extends Omit<MVPData,
    'qualityMeasureIds' |
    'iaMeasureIds' |
    'costMeasureIds' |
    'foundationPiMeasureIds' |
    'foundationQualityMeasureIds' |
    'administrativeClaimsMeasureIds'> {
    measureIds: string[];
    qualityMeasureIds: string[];
    iaMeasureIds: string[];
    costMeasureIds: string[];
    foundationPiMeasureIds: string[];
    foundationQualityMeasureIds: string[];
    administrativeClaimsMeasureIds: string[];
}
