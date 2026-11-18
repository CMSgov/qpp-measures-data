import { Programs } from "../../util/interfaces/measure";

export type MVP = {
    mvpId: Programs;
    clinicalTopic: string;
    title: string;
    description: string;
    specialtiesMostApplicableTo: string[];
    clinicalTopics: string;
    qualityMeasureIds: string[];
    /** PY2027+. Quality measure IDs that are Core Measures for this MVP (mvp.json only). */
    coreQualityMeasureIds?: string[];
    iaMeasureIds: string[];
    costMeasureIds: string[];
    foundationPiMeasureIds: string[];
    foundationQualityMeasureIds: string[];
    administrativeClaimsMeasureIds: string[];
    hasCahps: boolean;
    hasOutcomeAdminClaims: boolean;
}

export enum MVPCategory {
    Quality = "Quality",
    CoreQuality = "Core Quality",
    Improvement = "Improvement",
    Cost = "Cost",
    Foundational = "Foundational"
}