const parse = require('csv-parse/lib/sync');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

/**
 * `import-qcdr-measures` reads a QCDR CSV file and creates valid measures,
 * then merges the result into an existing set of measures, throwing an error
 * if any existing measures with the same measureId has different values
 * for any existing properties.
 */

/**
 * [config defines how to generate QCDR measures from origin CSV file]
 * @type {Object}
 *
 *  * `constant_fields` are fields which are the same for all measures being
 *  created from the CSV input.
 *  * `source_fields` are fields which should find values in the CSV input.
 *
 */
const config = {
  constant_fields: {
    category: 'quality',
    firstPerformanceYear: 2017,
    lastPerformanceYear: null,
    eMeasureId: null,
    nqfEMeasureId: null,
    nqfId: null,
    measureSets: [],
    isRegistryMeasure: true
  },
  sourced_fields: {
    measureId: 2,
    title: 3,
    description: 4,
    nationalQualityStrategyDomain: 5,
    measureType: {
      index: 13,
      mappings: {
        'Process': 'process',
        'Outcome': 'outcome',
        'Patient Engagement/Experience ': 'patientEngagementExperience',
        'Patient Engagement/Experience': 'patientEngagementExperience',
        'Efficiency': 'efficiency',
        'Intermediate Outcome': 'intermediateOutcome',
        'Structure': 'structure',
        'Patient Reported Outcome': 'outcome',
        'Composite': 'outcome',
        'Cost/Resource Use': 'efficiency',
        'Cost/resource Use': 'efficiency',
        'Clinical Process Effectiveness': 'process'
      }
    },
    isHighPriority: {
      index: 14,
      mappings: {
        'High Priority': true,
        default: false
      }
    },
    isInverse: {
      index: 16,
      mappings: {
        N: false,
        Y: true,
        default: false
      }
    },
    isRiskAdjusted: {
      index: 20,
      mappings: {
        N: false,
        Y: true,
        default: false
      }
    },
    primarySteward: 22
    // `metricType` is a sourced field but not represented here since it maps from
    // multiple columns-- you can find it by searching in the code below
  }
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
const convertCsvToMeasures = function(records, config) {
  const sourcedFields = config.sourced_fields;
  const constantFields = config.constant_fields;

  const newMeasures = records.map(function(record) {
    var newMeasure = {};
    Object.entries(sourcedFields).forEach(function([measureKey, columnObject]) {
      if (typeof columnObject === 'number') {
        if (!record[columnObject]) {
          throw TypeError('Column ' + columnObject + ' does not exist in source data');
        } else {
          // measure data maps directly to data in csv
          newMeasure[measureKey] = _.trim(record[columnObject]);
        }
      } else {
        // measure data requires mapping CSV data to new value, e.g. Y, N -> true, false
        const mappedValue = columnObject.mappings[_.trim(record[columnObject.index])];
        newMeasure[measureKey] = mappedValue || columnObject.mappings['default'];
      }
    });
    Object.entries(constantFields).forEach(function([measureKey, measureValue]) {
      newMeasure[measureKey] = measureValue;
    });

    // If the 'proportion' column (col 17) is Y and the other two columns
    // (continuous and ratio, cols 18 and 19) are N, metricType should be
    // 'singlePerformanceRate', or 'multiPerformanceRate' if there are multiple
    // strata/performance rates. Otherwise it should be 'nonProportion'
    const proportion = _.trim(record[17]);
    const continuous = _.trim(record[18]);
    const ratio = _.trim(record[19]);
    if (proportion === 'Y' && continuous === 'N' && ratio === 'N') {
      // returns an integer if passed string '3', NaN if passed 'N/A'
      const numPerformanceRates = _.parseInt(_.trim(record[11]));
      if (_.isInteger(numPerformanceRates) && numPerformanceRates > 1) {
        newMeasure['metricType'] = 'multiPerformanceRate';

        const overallPerformanceRate = _.lowerCase(_.trim(record[12]));
        const nthPerformanceRate = _.parseInt(overallPerformanceRate);
        if (_.isInteger(nthPerformanceRate)) {
          newMeasure['overallAlgorithm'] = 'overallStratumOnly';
        } else if (overallPerformanceRate === 'sum numerators') {
          newMeasure['overallAlgorithm'] = 'sumNumerators';
        } else if (overallPerformanceRate === 'weighted average') {
          newMeasure['overallAlgorithm'] = 'weightedAverage';
        }

        // Add the names and descriptions of strata
        let strataName;
        const measureId = _.trim(record[2]);
        const measureDescription = _.trim(record[4]);

        // Measure description column contains performance rate description
        // Split '*summary* Rate 1: text Rate 2: text' into [text, text]
        const strata = _.split(measureDescription, /\s*[Rr]ate [0-9]+:\s*/);
        // Drop anything before 'Rate 1' (usually a description of the measure)
        strata.shift();

        // TODO(kalvin): move strata names to a separate file
        // Note these arrays are ordered and represent the names of the
        // 1st, 2nd, 3rd etc. performance rates. Unlike the descriptions
        // for each strata/performance rate, the names do not come from a source
        // outside of this codebase. They were created by manually selecting
        // distinct keywords from the associated performance rate description
        // and are used when submitting to the API.
        const STRATA_NAMES = {
          'AHSQC6': ['hernia', 'overall', 'hernia>10cm'],
          'NHBPC15': ['ADL', 'IADL', 'overall'],
          'NHBPC7': ['reviewed', 'overall'],
          'AAAAI19': ['ICS', 'nonICS', 'overall'],
          'ARCO13': ['antithrombotic', 'anticoagulation', 'antithrombotic2', 'LDL'],
          'AHSQC9': ['overall', 'email'],
          'AQI49': ['lysine', 'mini', 'redcell', 'transfusion', 'overall'],
          'MOA1': ['back', 'neck'],
          'ECPR43': ['overall', 'urgentcare'],
          'MNCM3': ['pediatric', 'adult'],
          'NPAGSC3': ['overall', 'improvement'],
          'NPAGSC4': ['overall', 'improvement'],
          'NPAGSC5': ['overall', 'improvement'],
          'NPAGSC10': ['overall', 'improvement'],
          'NNEPTN1': ['12to18', '18'],
          'PP1': ['ace', 'digoxin', 'diuretics'],
          'RHI1': ['<9', '>=9', 'overall'],
          'RHI2': ['>=160', '<160', 'overall'],
          'RHI4': ['decreased', 'increased', 'overall'],
          'USWR15': ['bucket1', 'bucket2', 'bucket3', 'overall'],
          'USWR13': ['vital', 'glucose', 'overall'],
          'CDR6': ['bucket1', 'bucket2', 'bucket3', 'overall'],
          'NPA3': ['baseline', 'overall'],
          'NPA4': ['baseline', 'overall'],
          'NPA5': ['baseline', 'overall'],
          'ICLOPS15': ['withoutexcess', 'withexcess'],
          'ICLOPS17': ['withfollowup', 'withoutfollowup']
        };

        newMeasure['strata'] = [];
        _.each(strata, function(stratum, index) {
          strataName = STRATA_NAMES[measureId][index];
          // i + 1 because Rates in the csv are numbered starting from 1
          if (_.lowerCase(strataName) === 'overall' &&
            index + 1 !== nthPerformanceRate) {
            throw TypeError('"Overall" strata for ' + measureId + ' in QCDR ' +
              'CSV doesn\'t match the name in the strata details file');
          }
          newMeasure['strata'].push({
            'name': strataName,
            'description': strata[index]
          });
        });
      } else {
        newMeasure['metricType'] = 'singlePerformanceRate';
      }
    } else {
      newMeasure['metricType'] = 'nonProportion';
    }

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

function importMeasures(measuresDataPath, qcdrMeasuresDataPath, outputPath) {
  const qpp = fs.readFileSync(path.join(__dirname, measuresDataPath), 'utf8');
  const allMeasures = JSON.parse(qpp);

  const csv = fs.readFileSync(path.join(__dirname, qcdrMeasuresDataPath), 'utf8');
  const records = parse(csv, 'utf8');
  // remove header
  records.shift();
  // If there's more than one QCDR measure with the same measure, we can
  // arbitrarily pick one and ignore the others (they should all be
  // identical except for the QCDR Organization Name which we don't care about)
  const qcdrMeasures = _.uniqBy(convertCsvToMeasures(records, config), 'measureId');

  const mergedMeasures = mergeMeasures(allMeasures, qcdrMeasures, outputPath);
  return JSON.stringify(addMissingRegistryFlags(mergedMeasures), null, 2);
}

const measuresDataPath = process.argv[2];
const qcdrMeasuresDataPath = process.argv[3];
const outputPath = process.argv[4];

const newMeasures = importMeasures(measuresDataPath, qcdrMeasuresDataPath, outputPath);
fs.writeFileSync(path.join(__dirname, outputPath), newMeasures);
