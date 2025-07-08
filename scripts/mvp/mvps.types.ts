import { Programs } from "../../util/interfaces/measure";

export type MVP = {
    mvpId: Programs;
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

export enum MVPCategory {
    Quality = "Quality",
    Improvement = "Improvement",
    Cost = "Cost",
    Foundational = "Foundational"
}