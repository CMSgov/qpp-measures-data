/**
 * Expects from standard input a QPP JSON blob describing activity measures and
 * writes to standard output a JSON blob that conforms with the measures
 * schema.
 *
 * This script can be used as follows:
 * example: `cat qpp_ia_measures.json | node convert-qpp-to-measures.js ia > measures/measures-data.json`
 *
 * See README for details on generating measures-data.json.
 **/

// Libraries
const _ = require('lodash');
// Constants
const CEHRT_ELIGABLE_IA_MEASURE_IDS = [
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
const CMS_WEB_INTERFACE_INELIGIBLE_QUALITY_MEASURE_IDS = [
  '001',
  '117'
];
// Commandline arguments
const category = process.argv[2] || 'ia';
// Variables
let qpp = '';

process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
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
 *    national_quality_code | nationalQualityStrategyDomain
 *    measure_type          | measureType
 *    emsr_id               | eMeasureId
 *    nqf_emsr_num          | nqfEMeasureId
 *    nqf_num               | nqfId
 *    qlty_id               | measureId
 *    high_prrty_msr_sw     | isHighPriority
 *    submission_method     | submissionMethods
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
  let measureList;
  if (category === 'ia') {
    measureList = json.serviceData.cpiaActivities;
  } else if (category === 'aci') {
    measureList = json.serviceData.aci_measures.aci_stage_name1_measures
      .concat(json.serviceData.aci_measures.aci_stage_name2_measures);
  } else if (category === 'quality') {
    measureList = json.serviceData.pqrsMeasures;
  }
  const result = [];

  for (let i = 0; i < measureList.length; i++) {
    const measure = measureList[i];
    const obj = {};
    obj.category = category;
    obj.firstPerformanceYear = new Date().getFullYear();
    obj.lastPerformanceYear = null;
    obj.metricType = 'boolean'; // default

    _.forOwn(measure, function(value, key) {
      if (key === 'measure_title') {
        obj.title = value;
      } else if (key === 'measure_desc') {
        obj.description = value;
      } else if (key === 'measure_id') {
        obj.measureId = value;
        if (category === 'quality' && measure.qlty_id) {
          obj.measureId = measure.qlty_id;
        }
        if (category === 'ia') {
          obj.cehrtEligible = _.includes(CEHRT_ELIGABLE_IA_MEASURE_IDS, obj.measureId);
        }
      } else if (key === 'actvty_ctgry_desc') {
        obj.subcategoryId = formatString(value);
      } else if (key === 'actvty_wghtng_cd') {
        obj.weight = value.replace(/ /g, '').toLowerCase();
      } else if (key === 'base_score_required_sw') {
        obj.isRequired = value !== 'No';
      } else if (key === 'performance_score_weight_text') {
        obj.weight = parseWeight(value);
      } else if (key === 'measure_domain_desc') {
        obj.objective = formatString(value);
      } else if (key === 'submitting_requirement_text') {
        obj.metricType = parseMetricType(value);
      } else if (key === 'stage_name') {
        obj.measureSets = parseMeasureSet(value);
      } else if (key === 'bonus_optional_measure_sw') {
        obj.isBonus = value;
        if (obj.isBonus) {
          obj.weight = 5; // override weight if measure is a bonus measure
        }
      } else if (key === 'national_quality_code') {
        obj.nationalQualityStrategyDomain = _.trim(value);
      } else if (key === 'measure_type') {
        obj.measureType = formatString(value);
      } else if (key === 'emsr_id') {
        obj.eMeasureId = parseId(value);
      } else if (key === 'nqf_emsr_num') {
        obj.nqfEMeasureId = parseId(value);
      } else if (key === 'nqf_num') {
        obj.nqfId = parseId(value);
      } else if (key === 'high_prrty_msr_sw') {
        obj.isHighPriority = value !== 'No';
      } else if (key === 'prmry_msr_stwrd_name') {
        obj.primarySteward = value;
      } else if (key === 'submission_method') {
        const unabbrieviatedMethods = _.map(value, (method) => {
          method = {
            EHR: 'electronicHealthRecord',
            CSV: 'certifiedSurveyVendor'
          }[method] || method;
          return formatString(method);
        });
        // Certain measures are ineligible for certain submission methods
        obj.submissionMethods = _.filter(unabbrieviatedMethods, (value) => {
          return !(_.includes(CMS_WEB_INTERFACE_INELIGIBLE_QUALITY_MEASURE_IDS, obj.measureId) && value === 'cmsWebInterface');
        });
      } else if (key === 'speciality_list') {
        obj.measureSets = _.map(value, function(speciality) {
          return formatString(speciality);
        });
      } else if (category === 'quality') {
        // metricType for quality defaults to singlePerformanceRate
        obj.metricType = 'singlePerformanceRate';
        obj.strata = [];
      }
    });
    result.push(obj);
  }

  return JSON.stringify(result, null, 2);
}

/**
  * Replaces ampersands, slashes, and converts to camel case.
  */
function formatString(string) {
  return _.camelCase(string.replace('&', 'And')
    .replace('/', ''));
}

function parseWeight(weight) {
  switch (weight) {
    case '0':
      return 0;
    case '0 or 10%':
      return 10;
    case 'Up to 10%':
      return 10;
    case 'Up to 20%':
      return 20;
    default:
      throw new Error('Invalid weight: ' + weight);
  }
}

function parseMetricType(metricType) {
  switch (metricType) {
    case 'Numerator/ Denominator':
      return 'proportion';
    case 'Yes/No Statement':
      return 'boolean';
    default:
      throw new Error('Invalid metric type: ' + metricType);
  }
}

function parseMeasureSet(measureSet) {
  switch (measureSet) {
    case '2017 Advancing Care Information Transition Objectives and Measures':
      return ['transition'];
    default:
      return [];
  }
}

function parseId(id) {
  return (id === 'N/A') ? null : id;
}
