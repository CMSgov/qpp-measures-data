var fs = require('fs');
var path = require('path');

/**
 * Expects from standard input a QPP JSON blob describing activity measures and
 * writes to standard output a JSON blob that conforms with a specified version
 * of the measures schema. If no version is specified, the schema version will
 * default to the latest.
 **/

var version = process.argv[2] || '0.0.1';

// TODO (Mari): Only handles the conversion of Improvement Activity Measures
var category = 'ia';

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
 * Takes a JSON cpiaActivities object and returns a measuresData JSON object.
 * Replaces or adds key/value pairs from cpiaActivities as follows:
 *    cpiaActivity key | measuresData key
 *    ------------------------------------
 *    measure_title    | title
 *    measure_desc     | description
 *    measure_id       | measureId
 *    actvty_ctgry_desc| subcategoryId
 *    actvty_wghtng_cd | weight
 *    N/A              | category
 *    N/A              | metricType (defaults to 'boolean')
 *    N/A              | publishDate (defaults to the current time)
 */
function parseQpp(json) {
  var measureSetList = json.serviceData.categoryList;
  var measureList = json.serviceData.cpiaActivities;
  var result = [];

  for (var i=0; i< measureList.length; i++) {
    var measure = measureList[i];
    var obj = {};
    for (var j in measure) {
      if (j === 'measure_title') {
        obj.title = measure[j];
      } else if (j === 'measure_desc') {
        obj.description = measure[j];
      } else if (j === 'measure_id') {
        obj.measureId = measure[j];
      } else if (j === 'actvty_ctgry_desc') {
        obj.subcategoryId = lowercaseFirstLetter(measure[j].replace('&','And')
                                                           .replace(/ /g,'')
                                                           .replace(/and([A-Z])/,"And$1"));
      } else if (j === 'actvty_wghtng_cd') {
        obj.weight = measure[j].replace(/ /g, '').toLowerCase();
      }

      obj.category = category;
      obj.metricType = 'boolean';
      obj.firstPerformanceYear = new Date().getFullYear();
    }
    result.push(obj);
  }
  return JSON.stringify(result, null, 2);;
}

function lowercaseFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}
