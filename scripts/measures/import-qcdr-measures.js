const parse = require('csv-parse/lib/sync');
const _ = require('lodash');

const fs = require('fs');
const path = require('path');

/**
 * `import-qcdr-measures` reads a QCDR CSV file and outputs valid measures
 * using `convertCsvToMeasures` and a config object.
 */

const MEASURES_DATA_JSON_PATH = '../../staging/measures-data.json';
const QCDR_MEASURES_CSV_PATH = '../../util/measures/latest-QCDR-Measures-20170911.csv';

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
    // If any of the three CSV columns are Y, map to 'singlePerformanceRate' or
    // 'continuousVariable' depending on the columns; if none are Y (all are N)
    // map to 'cahps'
    metricType: {
      mapType: 'mutuallyExclusiveMapSets',
      mappings: {
        Y: [{
          indices: [17],
          mapTo: 'singlePerformanceRate'
        }, {
          indices: [18, 19],
          mapTo: 'continuousVariable'
        }],
        default: 'cahps'
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
        if (columnObject.index) {
          const mappedValue = columnObject.mappings[_.trim(record[columnObject.index])];
          newMeasure[measureKey] = mappedValue || columnObject.mappings['default'];
        } else if (columnObject.mapType === 'mutuallyExclusiveMapSets') {
          // This field maps to more than one set of CSV columns, of which up to
          // one set max will contain true columns ('Y'). Determine
          // which set does and use the corresponding mapTo value. If none of
          // the sets do, use the default.
          _.each(columnObject.mappings['Y'], function(option) {
            let mapToValue = _.find(option.indices, function(index) {
              return _.trim(record[index]) === 'Y';
            });
            // Once we find the one true/'Y' value, we're done. Break out of .each
            if (!_.isUndefined(mapToValue)) {
              newMeasure[measureKey] = option.mapTo;
              return false;
            }
          });

          // If none of the columns contain a true value, use the default
          if (_.isEmpty(newMeasure[measureKey])) {
            newMeasure[measureKey] = columnObject.mappings['default'];
          }
        }
      }
    });
    Object.entries(constantFields).forEach(function([measureKey, measureValue]) {
      newMeasure[measureKey] = measureValue;
    });
    return newMeasure;
  });

  return newMeasures;
};

function enrichQCDRMeasures() {
  const qpp = fs.readFileSync(path.join(__dirname, MEASURES_DATA_JSON_PATH), 'utf8');
  const allMeasures = JSON.parse(qpp);

  const csv = fs.readFileSync(path.join(__dirname, QCDR_MEASURES_CSV_PATH), 'utf8');
  const records = parse(csv, 'utf8');
  // remove header
  records.shift();
  // If there's more than one QCDR measure with the same measure, we can
  // arbitrarily pick one and ignore the others (basically, they should all be
  // identical except for the QCDR Organization Name which we don't care about)
  const qcdrMeasures = _.uniqBy(convertCsvToMeasures(records, config), 'measureId');

  const addedMeasureIds = [];
  const modifiedMeasureIds = [];

  // If measure exists already, merge in keys from QCDR measures. If any existing
  // keys have a different value, throw an error.
  // If measure doesn't exist, create it.
  _.each(qcdrMeasures, function(measure) {
    const id = measure.measureId;
    const existingMeasure = _.find(allMeasures, {'measureId': id});

    if (id === 'ACR7') {
      console.log("ok", existingMeasure);
      return;
    }
    if(existingMeasure) {
      const conflictingMeasures = _.reduce(measure, function(result, value, key) {
        const existingValue = existingMeasure['key'];
        // isEqual does a deep comparison so this works with strata as well
        if(!_.isEmpty(existingValue) && !_.isEqual(value, existingValue)) {
          return result.push('key:' + key + ', qcdr value' + value +
            ' differs from existing value: ' + existingValue);
        } else {
          return result;
        }
      }, []);

      if(!_.isEmpty(conflictingMeasures)) {
        throw TypeError('QCDR measure with id ' + id + 'conflicts with existing ' +
          'measure. See: ' + conflictingMeasures);
      } else {
        _.assign(existingMeasure, measure);
        modifiedMeasureIds.push(id);
      }
    } else {
      allMeasures.push(measure);
      addedMeasureIds.push(id);
    }
  });

  console.log('Added measures with the following ids: ' +
    addedMeasureIds + '\n');
  console.log('Modified measures with the following ids: ' +
    modifiedMeasureIds + '\n');

  return JSON.stringify(allMeasures, null, 2);
}

fs.writeFileSync(path.join(__dirname, MEASURES_DATA_JSON_PATH), enrichQCDRMeasures());

console.log('Successfully merged QCDR measures into ' + MEASURES_DATA_JSON_PATH);
// fs.writeFileSync(path.join(__dirname, '../../measures/measures-data.json'), convertCsvToMeasures(records, config));
