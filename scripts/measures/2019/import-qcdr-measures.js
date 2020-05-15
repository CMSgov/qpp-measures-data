const parse = require('csv-parse/lib/sync');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

/**
 * [config defines how to generate QCDR measures from origin CSV file]
 * @type {Object}
 *
 *  * `constant_fields` are fields which are the same for all measures being
 *  created from the CSV input.
 *  * `mapped_fields` are fields which should find values in the CSV input.
 *  * `referenced_fields` are fields which are only referenced and not mapped.
 *
 */
const config = {
  constant_fields: {
    category: 'quality',
    lastPerformanceYear: null,
    eMeasureId: null,
    nqfEMeasureId: null,
    measureSets: [],
    isRegistryMeasure: true,
    isIcdImpacted: false
  },
  mapped_fields: {
    // qcdrName: 0
    measureId: 1,
    title: 2,
    description: 3,
    nqfId: {
      index: 4,
      mappings: {
        'N/A': null
      }
    },
    nationalQualityStrategyDomain: 5,
    measureType: {
      index: 7,
      mappings: {
        'Process': 'process',
        'Outcome': 'outcome',
        'Patient Engagement/Experience': 'patientEngagementExperience',
        'Efficiency and Cost/Resource Use': 'efficiency',
        'Intermediate Outcome': 'intermediateOutcome',
        'Structure': 'structure',
        'Patient Reported Outcome (PRO)': 'outcome',
        'Clinical Process Effectiveness': 'process'
      }
    },
    isHighPriority: {
      index: 6,
      mappings: {
        'High Priority': true,
        Yes: true,
        No: false,
        default: false
      }
    },
    isInverse: {
      index: 8,
      mappings: {
        No: false,
        Yes: true,
        default: false
      }
    },
    isRiskAdjusted: {
      index: 14,
      mappings: {
        No: false,
        Yes: true,
        default: false
      }
    },
    primarySteward: 15,
    firstPerformanceYear: 16
    // `metricType` is a sourced field but not represented here since it maps from
    // multiple columns-- you can find it by searching in the code below
  },
  referenced_fields: {
    proportional: 9,
    continuous: 10,
    ratio: 11,
    numberOfPerformanceRates: 12,
    overallPerformanceRate: 13
  }
};

const addMultiPerformanceRateDetails = function(newMeasure, record, qcdrStrataNamesDataPath, config) {
  // Parse the names for qcdr measures with multiple strata/performance rates
  // { measureId: [name of 1st performance rate, name of 2nd performance rate, etc.] }
  //
  // In the strata names file, note that the order of the array values matter.
  // Also, unlike the descriptions for each of the strata/performance rates,
  // the names do not come from a source outside of this codebase. They were
  // created by manually selecting distinct keywords from the associated
  // performance rate description and are used when submitting to the API.
  const strataNames = fs.readFileSync(path.join(__dirname, qcdrStrataNamesDataPath), 'utf8');
  const qcdrStrataNames = JSON.parse(strataNames);
  const referencedFields = config.referenced_fields;
  const mappedFields = config.mapped_fields;

  newMeasure['metricType'] = 'registryMultiPerformanceRate';

  const overallPerformanceRate = _.lowerCase(_.trim(record[referencedFields.overallPerformanceRate]));
  const nthPerformanceRate = _.parseInt(overallPerformanceRate[0]);
  if (_.isInteger(nthPerformanceRate)) {
    newMeasure['overallAlgorithm'] = 'overallStratumOnly';
  } else if (overallPerformanceRate === 'sum numerators') {
    newMeasure['overallAlgorithm'] = 'sumNumerators';
  } else if (overallPerformanceRate === 'weighted average') {
    newMeasure['overallAlgorithm'] = 'weightedAverage';
  } else if (overallPerformanceRate === 'simple average') {
    newMeasure['overallAlgorithm'] = 'simpleAverage';
  }

  // Add the names and descriptions of strata
  let strataName;
  const measureId = record[mappedFields.measureId].replace(/\s/g, ''); // "MOA 1" becomes "MOA1"
  const measureDescription = _.trim(record[mappedFields.description]);

  // Measure description column contains performance rate description
  // Split '*summary* Rate 1: text Rate 2: text' into [text, text]
  const strata = _.split(measureDescription, /\s*[Rr]ate [0-9]+:\s*/);
  // Drop anything before 'Rate 1' (usually a description of the measure)
  strata.shift();

  newMeasure['strata'] = [];
  _.each(strata, function(stratum, index) {
    if (_.isUndefined(qcdrStrataNames[measureId])) {
      throw TypeError('Missing strata for ' + measureId + '. Should ' +
        'be in ' + qcdrStrataNamesDataPath + ', but isn\'t.');
    }
    strataName = qcdrStrataNames[measureId][index];

    // i + 1 because Rates in the csv are numbered starting from 1
    if (_.lowerCase(strataName) === 'overall' &&
      index + 1 !== nthPerformanceRate) {
      throw TypeError('"Overall" strata for ' + measureId + ' in QCDR ' +
        'CSV doesn\'t match the name in ' + qcdrStrataNamesDataPath + ' ' + nthPerformanceRate);
    }
    // A rate description will fit on a single line, remove any superfluous text
    // then trim all remaining whitespace.
    const desc = _.trim(_.split(strata[index], '\n')[0]);

    newMeasure['strata'].push({
      'name': strataName,
      'description': desc
    });
  });

  return newMeasure;
};

/**
 * [convertCsvToMeasures description]
 * @param  {array of arrays}  records each array in the outer array represents a new measure, each inner array its attributes
 * @param  {object}           config  object defining how to build a new measure from this csv file, including mapping of measure fields to column indices
 * @return {array}            Returns an array of measures objects
 *
 * Notes:
 * 1. The terms [performance rate] 'strata' and 'performance rates' are used interchangeably
 * 2. We trim all data sourced from CSVs because people sometimes unintentionally include spaces or linebreaks
 */
const convertCsvToMeasures = function(records, config, qcdrStrataNamesDataPath) {
  const mappedFields = config.mapped_fields;
  const constantFields = config.constant_fields;
  const referencedFields = config.referenced_fields;
  const TRUE_CSV = 'Yes';
  const FALSE_CSV = 'No';

  const newMeasures = records.map((record) => {
    const newMeasure = {};
    Object.entries(mappedFields).forEach(function([measureKey, columnObject]) {
      if (typeof columnObject === 'number') {
        if (!record[columnObject]) {
          throw TypeError('Column ' + columnObject + ' does not exist in source data ' + record.length + ' ' + measureKey);
        } else {
          // measure data maps directly to data in csv
          let value = _.trim(record[columnObject]);
          if (measureKey === 'firstPerformanceYear') {
            value = Number(value);
          }
          newMeasure[measureKey] = value;
        }
      } else {
        const value = _.trim(record[columnObject.index]);
        const mappedValue = columnObject.mappings[value];
        const defaultValue = columnObject.mappings['default'];

        // some measure data requires mapping CSV data to new value, e.g. Yes, No -> true, false, use this is applicable
        // otherwise use a default if it exists
        // if no default or mapped value, use the value as-is
        if (!_.isUndefined(mappedValue)) {
          newMeasure[measureKey] = mappedValue;
        } else if (!_.isUndefined(defaultValue)) {
          newMeasure[measureKey] = defaultValue;
        } else {
          newMeasure[measureKey] = value;
        }
      }
    });
    Object.entries(constantFields).forEach(function([measureKey, measureValue]) {
      newMeasure[measureKey] = measureValue;
    });

    // If the 'proportion' column (col 17) is Y and the other two columns
    // (continuous and ratio, cols 18 and 19) are N, metricType should be
    // 'singlePerformanceRate', or 'multiPerformanceRate' if there are multiple
    // strata/performance rates. Otherwise it should be 'nonProportion'
    const proportion = _.trim(record[referencedFields.proportional]);
    const continuous = _.trim(record[referencedFields.continuous]);
    const ratio = _.trim(record[referencedFields.ratio]);

    if (proportion === TRUE_CSV && continuous === FALSE_CSV && ratio === FALSE_CSV) {
      // returns an integer if passed string '3', NaN if passed 'N/A'
      const numPerformanceRates = _.parseInt(_.trim(record[referencedFields.numberOfPerformanceRates]));
      if (_.isInteger(numPerformanceRates) && numPerformanceRates > 1) {
        addMultiPerformanceRateDetails(newMeasure, record, qcdrStrataNamesDataPath, config);
      } else {
        newMeasure['metricType'] = 'registrySinglePerformanceRate';
      }
    } else {
      newMeasure['metricType'] = 'nonProportion';
    }

    newMeasure['submissionMethods'] = ['registry'];

    return newMeasure;
  });
  return newMeasures;
};

function mergeMeasures(allMeasures, qcdrMeasures, measuresDataPath) {
  const addedMeasureIds = [];
  const modifiedMeasureIds = [];

  // If measure exists already, merge in keys from QCDR measures. If any existing
  // non-empty keys have a different value, throw an error.
  // If measure doesn't exist, create it.
  _.each(qcdrMeasures, function(measure) {
    const id = measure.measureId;
    const existingMeasure = _.find(allMeasures, {'measureId': id});

    if (existingMeasure && !_.isEqual(existingMeasure, measure)) {
      const conflictingValues = _.reduce(measure, function(result, value, key) {
        const existingValue = existingMeasure[key];
        // isEqual does a deep comparison so this works with strata as well
        if (!_.isNil(existingValue) && !_.isEqual(value, existingValue)) {
          result.push({
            'existingKey': key,
            'existingValue': existingValue,
            'conflictingQcdrValue': value
          });
        }
        return result;
      }, []);

      if (!_.isEmpty(conflictingValues)) {
        throw TypeError('QCDR measure with measureId: "' + id + '" conflicts' +
        ' with existing measure. See below:\n' + JSON.stringify(conflictingValues, null, 2));
      } else {
        _.assign(existingMeasure, measure);
        modifiedMeasureIds.push(id);
      }
    } else if (!existingMeasure) {
      allMeasures.push(measure);
      addedMeasureIds.push(id);
    }
  });

  if (_.isEmpty(addedMeasureIds) && _.isEmpty(modifiedMeasureIds)) {
    console.log('Import complete. No measures added to or modified in ' + measuresDataPath);
  } else {
    console.log('Added measures with the following ids: ' +
      addedMeasureIds + '\n');
    console.log('Modified measures with the following ids: ' +
      modifiedMeasureIds + '\n');
    console.log('Successfully merged QCDR measures into ' + measuresDataPath);
  }

  return allMeasures;
}

// We want to add the new isRegistryMeasure field to all quality measures,
// not just the measures where it's true (aka qcdr measures)
function addMissingRegistryFlags(measures) {
  _.each(measures, function(measure) {
    if (measure.category === 'quality' && !_.isBoolean(measure.isRegistryMeasure)) {
      measure.isRegistryMeasure = false;
    }
  });
  return measures;
}

function importMeasures(measuresDataPath, qcdrMeasuresDataPath, qcdrStrataNamesDataPath, outputPath) {
  const qpp = fs.readFileSync(path.join(__dirname, measuresDataPath), 'utf8');
  const allMeasures = JSON.parse(qpp);

  const csv = fs.readFileSync(path.join(__dirname, qcdrMeasuresDataPath), 'utf8');
  const qcdrCsv = parse(csv, 'utf8');
  // remove header
  qcdrCsv.shift();

  // If there's more than one QCDR measure with the same measure, we can
  // arbitrarily pick one and ignore the others (they should all be
  // identical except for the QCDR Organization Name which we don't care about)
  const qcdrMeasures = _.uniqBy(convertCsvToMeasures(qcdrCsv, config, qcdrStrataNamesDataPath), 'measureId');

  const mergedMeasures = mergeMeasures(allMeasures, qcdrMeasures, outputPath);
  return JSON.stringify(addMissingRegistryFlags(mergedMeasures), null, 2);
}

const measuresDataPath = process.argv[2];
const qcdrMeasuresDataPath = process.argv[3];
const qcdrStrataNamesDataPath = process.argv[4];

const newMeasures = importMeasures(measuresDataPath, qcdrMeasuresDataPath, qcdrStrataNamesDataPath, measuresDataPath);
fs.writeFileSync(path.join(__dirname, measuresDataPath), newMeasures);
