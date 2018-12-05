const _ = require('lodash');
const QppMeasuresData = require('../');
const Constants = require('../constants.js');

const currentYear = Number(process.argv[2]);

const validateExistenceOfCurrentYearMeasuresInPreviousYearMeasures = (currentYearMeasuresData) => {
  // get an array of all first performance years, e.g. [2017, 2018], excluding the current year
  const firstPerformanceYears =
    _.pull(
      _.uniq(_.map(currentYearMeasuresData, 'firstPerformanceYear')),
      currentYear);

  if (!_.every(firstPerformanceYears, (year) => year < currentYear)) {
    throw Error('One or more measures has a first performance year in the future');
  }

  firstPerformanceYears.forEach((previousYear) => {
    // First performance year began on or before the previous year and
    // last performance year isn't set yet or is greater or equal to the previous year
    const isWithinValidYears = (measure) => {
      return measure.firstPerformanceYear <= previousYear &&
        (_.isNull(measure.lastPerformanceYear) || measure.lastPerformanceYear >= currentYear);
    };

    const previousYearMeasuresData = QppMeasuresData.getMeasuresData(previousYear);
    // Get measures from the performance year measures-data with a
    // performance year range that includes the previous year
    const measuresSupposedlyExistingInPreviousYear = currentYearMeasuresData.filter(isWithinValidYears);

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
        console.error(`Measure Id ${measureId} exists in ${currentYear} but not ${previousYear}`);
      }
    });
  });
};

let json = '';
if (Constants.validPerformanceYears.includes(currentYear)) {
  process.stdin.setEncoding('utf8');

  process.stdin.on('readable', function() {
    const chunk = this.read();
    if (chunk !== null) {
      json += chunk;
    }
  });

  process.stdin.on('end', function() {
    const newMeasuresData = JSON.parse(json);
    validateExistenceOfCurrentYearMeasuresInPreviousYearMeasures(newMeasuresData);
  });
} else {
  throw Error(`${currentYear} is an invalid performance year. Must be 2019 or later. We don't have measures data from prior to 2017`);
}
