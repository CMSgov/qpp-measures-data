const _ = require('lodash');
const Constants = require('../../constants');
const QppMeasuresData = require('../..');

const currentPerformanceYear = Number(process.argv[2] || Constants.currentPerformanceYear);
const performanceYear = currentPerformanceYear + 1;
const historicalYear = performanceYear - 2;

console.log('========')
console.log(performanceYear, historicalYear)
console.log('========')

// First performance year began on or before the historical year and
// last performance year isn't set yet or is greater or equal to the historical year
const isWithinValidYears = (measure) => {
  return measure.firstPerformanceYear <= historicalYear &&
    (_.isNull(measure.lastPerformanceYear) || measure.lastPerformanceYear >= performanceYear);
};

const validateMeasureValidityForPerformanceAndHistoricalYears = (performanceYear, historicalYear) => {
  const performanceYearMeasuresData = QppMeasuresData.getMeasuresData(performanceYear);
  const historicalYearMeasuresData = QppMeasuresData.getMeasuresData(historicalYear);

  // Get measures from the performance year measures-data with a
  // performance year range that includes the historical year
  const measuresSupposedlyExistingInHistoricalYear = performanceYearMeasuresData.filter(isWithinValidYears);

  // Get measures from the actual historical year measures-data
  // In theory this should match the measuresSupposedlyExistingInHistoricalYear
  const measuresExistingInHistoricalYear = historicalYearMeasuresData.filter(isWithinValidYears);
  const historicalYearMeasureIds = _.map(measuresExistingInHistoricalYear, m => {
    let measureId = m.measureId.toUpperCase();
    if (historicalYear === 2017) {
      // ACI measures were all renamed to PI measures between 2017 and 2018
      // and spaces were removed from all measures between 2017 and 2018
      measureId = measureId.replace(/^ACI_/, 'PI_').replace(/ /, '');
    }
    return measureId;
  });

  // Throw an error if a measure is valid in the performance year but is
  // not in the historical year's measures data
  measuresSupposedlyExistingInHistoricalYear.forEach((measure) => {
    const measureId = measure.measureId.toUpperCase();

    if (!historicalYearMeasureIds.includes(measureId)) {
      console.error(`Measure Id ${measureId} exists in ${currentPerformanceYear} but not ${historicalYear}`);
    }
  });
};

if (performanceYear && historicalYear) {
  validateMeasureValidityForPerformanceAndHistoricalYears(currentPerformanceYear, historicalYear);
} else {
  console.error('Please supply performance year!\nExample command: node validate-historical-measures-in-performance-year.js 2019');
}
