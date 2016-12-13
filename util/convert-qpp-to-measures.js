/**
 * Expects from standard input a QPP JSON blob describing activity measures and
 * writes to standard output a JSON blob that conforms with a specified version
 * of the measures schema. If no version is specified, the schema version will
 * default to the latest.
 *
 * This script can be used as follows:
 * cat qpp_ia_measures.json | node convert-qpp-to-measures.js 0.0.1 ia > measures-data.json
 **/

var fs = require('fs');
var path = require('path');

var version = process.argv[2] || '0.0.1';

var category = process.argv[3] || 'ia';

var qpp = '';

process.stdin.setEncoding('utf8');

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
 *    IA key | measuresData key
 *    ------------------------------------
 *    measure_title    | title
 *    measure_desc     | description
 *    measure_id       | measureId
 *    actvty_ctgry_desc| subcategoryId
 *    actvty_wghtng_cd | weight
 *    N/A              | category
 *    N/A              | metricType (defaults to 'boolean')
 *    N/A              | firstPerformanceYear (defaults to the current year)
 *
 * For Advancing Care Information, the replacement is as follows:
 *    ACI key               | measuresData key
 *    ------------------------------------------------
 *    measure_title                 | title
 *    measure_desc                  | description
 *    stage_name                    | measureSet
 *    measure_id                    | measureId
 *    base_score_required_sw        | isRequired
 *    performance_score_weight_text | weight
 *    measure_domain_desc           | objective
 *    submitting_requirement_text   | metricType
 *    bonus_optional_measure_sw     | isBonus
 *    N/A                           | category
 *    N/A                           | firstPerformanceYear (defaults to the current year)
 */
function parseQpp(json) {
  var measureSetList = json.serviceData.categoryList;
  if (category === 'ia') {
    var measureList = json.serviceData.cpiaActivities;
  } else if (category === 'aci') {
    var measureList = json.serviceData.aci_measures.aci_stage_name1_measures
      .concat(json.serviceData.aci_measures.aci_stage_name2_measures);
  }
  var result = [];

  for (var i=0; i< measureList.length; i++) {
    var measure = measureList[i];
    var obj = {};
    for (var j in measure) {
      obj.category = category;
      obj.metricType = 'boolean'; // default
      obj.firstPerformanceYear = new Date().getFullYear();

      if (j === 'measure_title') {
        obj.title = measure[j];
      } else if (j === 'measure_desc') {
        obj.description = measure[j];
      } else if (j === 'measure_id') {
        obj.measureId = measure[j];
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
      } else if (j === 'bonus_optional_measure_sw') {
        obj.isBonus = measure[j];
        if (obj.isBonus) {
          obj.weight = 5; // override weight if measure is a bonus measure
        }
      }
    }
    result.push(obj);
  }
  return JSON.stringify(result, null, 2);;
}

/**
  * Removes spaces, replaces ampersands, capitalizes 'And' and 'Of' and
  * lowercases the first letter.
  */
function formatString(string) {
  string = string.replace('&','And')
        .replace(/ /g,'')
        .replace(/and([A-Z])/,"And$1")
        .replace(/of([A-Z])/,"Of$1")
  return string.charAt(0).toLowerCase() + string.slice(1);
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
    case 'Numerator\/ Denominator':
      return 'proportion';
    case 'Yes\/No Statement':
      return 'boolean';
    default:
      throw new Error("Invalid metric type: " + metricType);
  }
}
