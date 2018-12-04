const _ = require('lodash');
const QppMeasuresData = require('../');

const performanceYear = Number(process.argv[2]);
const previousYear = performanceYear - 1;

// First performance year began on or before the previous year and
// last performance year isn't set yet or is greater or equal to the previous year
const isWithinValidYears = (measure) => {
  return measure.firstPerformanceYear <= previousYear &&
    (_.isNull(measure.lastPerformanceYear) || measure.lastPerformanceYear >= performanceYear);
};

const validateFirstPerformanceYears = (measureJson, previousYear) => {
  const performanceYearMeasuresData = JSON.parse(measureJson);

  const previousYearMeasuresData = QppMeasuresData.getMeasuresData(previousYear);

  // Get measures from the performance year measures-data with a
  // performance year range that includes the previous year
  const measuresSupposedlyExistingInPreviousYear = performanceYearMeasuresData.filter(isWithinValidYears);

  // Get measures from the actual previous year measures-data
  // In theory this should match the measuresSupposedlyExistingInPreviousYear
  const measuresExistingInPreviousYear = previousYearMeasuresData.filter(isWithinValidYears);
  const previousYearMeasureIds = _.map(measuresExistingInPreviousYear, m => {
    let measureId = m.measureId.toUpperCase();
    if (previousYear === 2017) {
      // ACI measures were all renamed to PI measures between 2017 and 2018
      // and spaces were removed from all measures between 2017 and 2018
      measureId = measureId.replace(/^ACI_/, 'PI_').replace(/ /, '');
    }
    return measureId;
  });

  // Throw an error if a measure is valid in the performance year but is
  // not in the previous year's measures data
  measuresSupposedlyExistingInPreviousYear.forEach((measure) => {
    const measureId = measure.measureId.toUpperCase();

    if (!previousYearMeasureIds.includes(measureId)) {
      console.error(`Measure Id ${measureId} exists in ${performanceYear} but not ${previousYear}`);
    }
  });
};

let json = '';
if (previousYear >= 2017) {
  process.stdin.setEncoding('utf8');

  process.stdin.on('readable', function() {
    const chunk = this.read();
    if (chunk !== null) {
      json += chunk;
    }
  });

  process.stdin.on('end', function() {
    validateFirstPerformanceYears(json, previousYear);
  });
} else {
  throw Error(`${performanceYear} is an invalid performance year. Must be 2019 or later. We don't have measures data from prior to 2017`);
}
