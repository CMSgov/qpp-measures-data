const Constants = {};

Constants.validPerformanceYears = [2017, 2018, 2019, 2020, 2021, 2022, 2023];

// When you change the current performance year here, you must also change it in
// /scripts/measures/build-measures
Constants.currentPerformanceYear = 2022;

Constants.mvpMeasuresHelper = [{
  measureIdKey: 'qualityMeasureIds',
  enrichedMeasureKey: 'qualityMeasures'
}, {
  measureIdKey: 'iaMeasureIds',
  enrichedMeasureKey: 'iaMeasures'
}, {
  measureIdKey: 'costMeasureIds',
  enrichedMeasureKey: 'costMeasures'
}, {
  measureIdKey: 'foundationPiMeasureIds',
  enrichedMeasureKey: 'foundationPiMeasures'
}, {
  measureIdKey: 'foundationQualityMeasureIds',
  enrichedMeasureKey: 'foundationQualityMeasures'
}, {
  measureIdKey: 'administrativeClaimsMeasureIds',
  enrichedMeasureKey: 'administrativeClaimsMeasures'
}];

module.exports = Constants;
