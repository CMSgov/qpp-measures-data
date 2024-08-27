import { AggregateCostMeasure, IAMeasure, PIMeasure, QualityMeasure } from "./measure";

export interface BaseMVP {
    mvpId: string;
    clinicalTopic: string;
    title: string;
    description: string;
    specialtiesMostApplicableTo: string[];
    clinicalTopics: string;
    hasCahps: boolean;
    hasOutcomeAdminClaims: boolean;
}

export interface MVPData extends BaseMVP {
    qualityMeasures: QualityMeasure[];
    iaMeasures: IAMeasure[];
    costMeasures: AggregateCostMeasure[];
    foundationPiMeasures: PIMeasure[];
    foundationQualityMeasures: QualityMeasure[];
    administrativeClaimsMeasures: QualityMeasure[];
}

export interface MVPDataSlim extends BaseMVP {
    qualityMeasures: string[];
    iaMeasures: string[];
    costMeasures: string[];
    foundationPiMeasures: string[];
    foundationQualityMeasures: string[];
    administrativeClaimsMeasures: string[];
}