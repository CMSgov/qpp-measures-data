const _ = require('lodash');
const QppMeasuresData = require('../../../index.js');
const Constants = require('../../../constants.js');

const currentYear = Number(process.argv[2]);
if (!Constants.validPerformanceYears.includes(currentYear)) {
  throw Error(`${currentYear} is not a valid performance year; valid years are ${Constants.validPerformanceYears}`);
}

// The firstPerformanceYear field on measures isn't always accurate.
// This function iterates through measures in a newly generated measures-data and
// confirms that each measure actually existed in its firstPeformanceYear and subsequent years

// The lastPerformanceYear field is always null since measures that
// are no longer valid in a give performance year are removed entirely
const validateExistenceOfCurrentYearMeasuresInPreviousYearMeasures = (currentYearMeasuresData) => {
  // get an array of all first performance years, e.g. [2017, 2018], excluding the current year
  const firstPerformanceYears =
    _.pull(
      _.uniq(_.map(currentYearMeasuresData, 'firstPerformanceYear')),
      currentYear
    );

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
    // In practice these are examples of changes between 2017 and 2018:
    // QUANTUM41 => Quantum41, MOA 1 => MOA1, ACI_INFBLO_1 => PI_INFBLO_1
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

    // Print error message if a measure is valid in the performance year but is
    // not in the previous year's measures data
    measuresSupposedlyExistingInPreviousYear.forEach((measure) => {
      const measureId = measure.measureId.toUpperCase();

      if (!previousYearMeasureIds.includes(measureId)) {
        console.log(`${measureId} in ${currentYear} measures data supposedly exists in ${previousYear} measures data but does not`);
      }
    });
  });
};

let json = '';
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
