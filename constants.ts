interface IConstants {
  validPerformanceYears: number[];
  currentPerformanceYear: number;
  mvpMeasuresHelper: Array<{
    measureIdKey: string;
    enrichedMeasureKey: string;
  }>;
}

export const Constants: IConstants = {
  validPerformanceYears: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
  currentPerformanceYear: 2022,
  mvpMeasuresHelper: [
    {
      measureIdKey: 'qualityMeasureIds',
      enrichedMeasureKey: 'qualityMeasures'
    },
    {
      measureIdKey: 'iaMeasureIds',
      enrichedMeasureKey: 'iaMeasures'
    },
    {
      measureIdKey: 'costMeasureIds',
      enrichedMeasureKey: 'costMeasures'
    },
    {
      measureIdKey: 'foundationPiMeasureIds',
      enrichedMeasureKey: 'foundationPiMeasures'
    },
    {
      measureIdKey: 'foundationQualityMeasureIds',
      enrichedMeasureKey: 'foundationQualityMeasures'
    },
    {
      measureIdKey: 'administrativeClaimsMeasureIds',
      enrichedMeasureKey: 'administrativeClaimsMeasures'
    }
  ]
};
