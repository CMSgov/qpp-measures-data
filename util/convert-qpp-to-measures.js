/**
 * Expects from standard input a QPP JSON blob describing activity measures and
 * writes to standard output a JSON blob that conforms with the measures
 * schema.
 *
 * This script can be used as follows:
 * cat qpp_ia_measures.json | node convert-qpp-to-measures.js ia > measures-data.json
 **/

var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var category = process.argv[2] || 'ia';

var qpp = '';

process.stdin.setEncoding('utf8');

var CEHRT_ELIGABLE_IA_MEASURE_IDS = [
  'IA_AHE_2',
  'IA_BE_1',
  'IA_BE_15',
  'IA_BE_4',
  'IA_BMH_7',
  'IA_BMH_8',
  'IA_CC_1',
  'IA_CC_13',
  'IA_CC_8',
  'IA_CC_9',
  'IA_EPA_1',
  'IA_PM_13',
  'IA_PM_14',
  'IA_PM_15',
  'IA_PM_16',
  'IA_PM_2',
  'IA_PM_4',
  'IA_PSPA_16'
];

process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    qpp += chunk;
  }
});

process.stdin.on('end', () => {
  process.stdout.write(parseQpp(JSON.parse(qpp, 'utf8')));
});

/**
 * Takes a QPP JSON object and returns a measures data JSON object.
 * Replaces or adds key/value pairs from Improvement Activities as follows:
 *    IA key           | measuresData key
 *    ------------------------------------
 *    measure_title    | title
 *    measure_desc     | description
 *    measure_id       | measureId
 *    actvty_ctgry_desc| subcategoryId
 *    actvty_wghtng_cd | weight
 *    N/A              | category
 *    N/A              | metricType (defaults to 'boolean')
 *    N/A              | firstPerformanceYear (defaults to the current year)
 *    N/A              | lastPerformanceYear (defaults to null)
 *
 * For Advancing Care Information, the replacement is as follows:
 *    ACI key                       | measuresData key
 *    ------------------------------------------------
 *    measure_title                 | title
 *    measure_desc                  | description
 *    stage_name                    | measureSets
 *    measure_id                    | measureId
 *    base_score_required_sw        | isRequired
 *    performance_score_weight_text | weight
 *    measure_domain_desc           | objective
 *    submitting_requirement_text   | metricType
 *    bonus_optional_measure_sw     | isBonus
 *    N/A                           | category
 *    N/A                           | firstPerformanceYear (defaults to the current year)
 *    N/A                           | lastPerformanceYear (defaults to null)
 *
 * For Quality, the replacement is as follows:
 *    Quality key           | measuresData key
 *    ----------------------------------------
 *    measure_title         | title
 *    measure_desc          | description
 *    national_quality_code | nationalQualityCode
 *    measure_type          | measureType
 *    measure_id            | measureId
 *    emsr_id               | eMeasureId
 *    nqf_emsr_num          | nqfEMeasureId
 *    nqf_num               | nqfId
 *    qlty_id               | qualityId
 *    high_prrty_msr_sw     | isHighPriority
 *    submission_method     | methods
 *    speciality_list       | measureSets
 *    prmry_msr_stwrd_name  | primarySteward
 *    N/A                   | metricType
 *    N/A                   | isInverse
 *    N/A                   | overallAlgorithm
 *    N/A                   | strata
 *    N/A                   | category
 *    N/A                   | firstPerformanceYear
 *    N/A                   | lastPerformanceYear
 */
function parseQpp(json) {
  if (category === 'ia') {
    var measureList = json.serviceData.cpiaActivities;
  } else if (category === 'aci') {
    var measureList = json.serviceData.aci_measures.aci_stage_name1_measures
      .concat(json.serviceData.aci_measures.aci_stage_name2_measures);
  } else if (category === 'quality') {
    var measureList = json.serviceData.pqrsMeasures;
  }
  var result = [];

  for (var i=0; i< measureList.length; i++) {
    var measure = measureList[i];
    var obj = {};
    obj.category = category;
    obj.firstPerformanceYear = new Date().getFullYear();
    obj.lastPerformanceYear = null;
    obj.metricType = 'boolean'; // default

    for (var j in measure) {
      if (j === 'measure_title') {
        obj.title = measure[j];
      } else if (j === 'measure_desc') {
        obj.description = measure[j];
      } else if (j === 'measure_id') {
        obj.measureId = measure[j];
        if (category === 'ia') {
          obj.cehrtEligible = _.includes(CEHRT_ELIGABLE_IA_MEASURE_IDS, obj.measureId);
        }
      } else if (j === 'actvty_ctgry_desc') {
        obj.subcategoryId = formatString(measure[j]);
      } else if (j === 'actvty_wghtng_cd') {
        obj.weight = measure[j].replace(/ /g, '').toLowerCase();
      } else if (j === 'base_score_required_sw') {
        obj.isRequired = measure[j] === 'No' ? false : true;
      } else if (j === 'performance_score_weight_text') {
        obj.weight = parseWeight(measure[j]);
      } else if (j === 'measure_domain_desc') {
        obj.objective = formatString(measure[j]);
      } else if (j === 'submitting_requirement_text') {
        obj.metricType = parseMetricType(measure[j]);
      } else if (j === 'stage_name') {
        obj.measureSets = parseMeasureSet(measure[j]);
      } else if (j === 'bonus_optional_measure_sw') {
        obj.isBonus = measure[j];
        if (obj.isBonus) {
          obj.weight = 5; // override weight if measure is a bonus measure
        }
      } else if (j === 'national_quality_code') {
        obj.nationalQualityCode = _.trim(measure[j]);
      } else if (j === 'measure_type') {
        obj.measureType = formatString(measure[j]);
      } else if (j === 'emsr_id') {
        obj.eMeasureId = parseId(measure[j]);
      } else if (j === 'nqf_emsr_num') {
        obj.nqfEMeasureId = parseId(measure[j]);
      } else if (j === 'nqf_num') {
        obj.nqfId = parseId(measure[j]);
      } else if (j === 'qlty_id') {
        obj.qualityId = parseId(measure[j]);
      } else if (j === 'high_prrty_msr_sw') {
        obj.isHighPriority = measure[j] === 'No' ? false : true;
      } else if (j === 'prmry_msr_stwrd_name') {
        obj.primarySteward = measure[j];
      } else if (j === 'submission_method') {
        obj.methods = _.map(measure[j], function(method) {
          return formatString(method);
        });
      } else if (j === 'speciality_list') {
        obj.measureSets = _.map(measure[j], function(speciality) {
          return formatString(speciality);
        });
      } else if (category === 'quality') {
        // TODO (Mari): These will need to be populated via another mechanism
        // outside of the API (similar to CEHRT eligible IA measures)
        obj.isInverse = false;
        obj.metricType = 'performanceRatio';
        obj.overallAlgorithm = 'simpleAverage';
        obj.strata = [];
      }
    }
    result.push(obj);
  }
  return JSON.stringify(result, null, 2);;
}

/**
  * Replaces ampersands, slashes, and converts to camel case.
  */
function formatString(string) {
  return _.camelCase(string.replace('&', 'And')
                           .replace('/', ''));
}

function parseWeight(weight) {
  switch(weight) {
    case '0':
      return 0;
    case '0 or 10%':
      return 10;
    case 'Up to 10%':
      return 10;
    case 'Up to 20%':
      return 20;
    default:
      throw new Error("Invalid weight: " + weight);
  }
}

function parseMetricType(metricType) {
  switch(metricType) {
    case 'Numerator/ Denominator':
      return 'proportion';
    case 'Yes/No Statement':
      return 'boolean';
    default:
      throw new Error("Invalid metric type: " + metricType);
  }
}

function parseMeasureSet(measureSet) {
  switch(measureSet) {
    case '2017 Advancing Care Information Transition Objectives and Measures':
      return ['transition'];
    default:
      return [];
  }
}

function parseId(id) {
  return (id === 'N/A') ? null : id;
}
