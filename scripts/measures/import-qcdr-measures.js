const parse = require('csv-parse/lib/sync');

/**
 * `import-qcdr-measures` reads a QCDR CSV file and outputs valid measures
 * using `convertCsvToMeasures` and a config object.
 *
 * example:
 * $ cat util/measures/20170825-PIMMS-non-mips_measure_specifications.csv | node ./scripts/measures/import-qcdr-measures.js
 *
 * test:
 * $ cat util/measures/20170825-PIMMS-non-mips_measure_specifications.csv | node ./scripts/measures/import-qcdr-measures.js | node scripts/validate-data.js measures
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
    metricType: 'singlePerformanceRate',
    eMeasureId: null,
    nqfEMeasureId: null,
    nqfId: null,
    strata: [
      {
        name: 'overall'
      }
    ],
    measureSets: []
  },
  sourced_fields: {
    vendorId: 0,
    primarySteward: 1,
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
        'IntermediateOutcome': 'intermediateOutcome',
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
    }
  }
};

/**
 * [convertCsvToMeasures description]
 * @param  {array of arrays}  records each array in the outer array represents a new measure, each inner array its attributes
 * @param  {object}           config  object defining how to build a new measure from this csv file, including mapping of measure fields to column indices
 * @return {array}            Returns an array of measures objects
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
          newMeasure[measureKey] = record[columnObject];
        }
      } else {
        // measure data requires mapping CSV data to new value, e.g. Y, N -> true, false
        const mappedValue = columnObject.mappings[record[columnObject.index]];
        newMeasure[measureKey] = mappedValue || columnObject.mappings['default'];
      }
    });
    Object.entries(constantFields).forEach(function([measureKey, measureValue]) {
      newMeasure[measureKey] = measureValue;
    });
    return newMeasure;
  });

  return newMeasures;
};

let csvFile = '';

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    csvFile += chunk;
  }
});

process.stdin.on('end', function() {
  const records = parse(csvFile, 'utf8');
  // remove header
  records.shift();
  process.stdout.write(JSON.stringify(convertCsvToMeasures(records, config), null, 2));
});
