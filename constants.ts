interface MVPMeasureHelper {
    measureIdKey: string;
    enrichedMeasureKey: string;
}

// When you change the current performance year here, you must also change it in
// /scripts/measures/build-measures
const Constants = {
    validPerformanceYears: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] as number[],
    currentPerformanceYear: 2022,
    mvpMeasuresHelper: [
        { measureIdKey: 'qualityMeasureIds', enrichedMeasureKey: 'qualityMeasures' },
        { measureIdKey: 'iaMeasureIds', enrichedMeasureKey: 'iaMeasures' },
        { measureIdKey: 'costMeasureIds', enrichedMeasureKey: 'costMeasures' },
        { measureIdKey: 'foundationPiMeasureIds', enrichedMeasureKey: 'foundationPiMeasures' },
        { measureIdKey: 'foundationQualityMeasureIds', enrichedMeasureKey: 'foundationQualityMeasures' },
        { measureIdKey: 'administrativeClaimsMeasureIds', enrichedMeasureKey: 'administrativeClaimsMeasures' },
    ] as MVPMeasureHelper[]
};

export default Constants;
