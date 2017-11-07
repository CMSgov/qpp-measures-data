const parse = require('csv-parse/lib/sync');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

/**
 * `import-qcdr-measures` reads a QCDR CSV file and outputs valid measures,
 * then merges the result into existing measures-data.json, throwing an error
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
    strata: [
      {
        name: 'overall'
      }
    ],
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
 * We trim all data sourced from CSVs because people sometimes unintentionally include spaces or linebreaks
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
    // 'singlePerformanceRate'. Otherwise it should be 'nonProportion'
    //
    // Note: if the 'proportion' column is Y *and* there are multiple
    // strata, then the metricType should be 'multiPerformanceRate'
    // TODO(kalvin): implement multiPerformanceRate;
    if (record[17] === 'Y' &&
        record[18] === 'N' &&
        record[19] === 'N') {
      newMeasure['metricType'] = 'singlePerformanceRate';
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
        if (!_.isEmpty(existingValue) && !_.isEqual(value, existingValue)) {
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
