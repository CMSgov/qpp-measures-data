// this script merges the tmp/quality-performance-rates.json,
// measures/quality-measures-additional-info.json, and the measures from stdin
// into a new file that has more info about each performance strata
var _     = require('lodash');
var fs    = require('fs');
var path  = require('path');
var qpp = '';

process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    qpp += chunk;
  }
});

process.stdin.on('end', () => {
  process.stdout.write(mergeQpp(JSON.parse(qpp, 'utf8')));
});

function mergeQpp(qppJson) {
  // read in tmp/quality-performance-rates.json
  var performanceRatesJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../util/quality-performance-rates.json'), 'utf8'));
  // read in measures/quality-measures-additional-info.json
  var performanceRateAdditionalJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../util/quality-measures-strata-details.json'), 'utf8'));

  var measuresNotFound = [];
  // iterate through all qppJson measures and find matching items from other json blobs
  qppJson.forEach(function(qppItem, index) {
    if (qppItem.category === 'quality') {
      var performanceRateDescription = _.find(performanceRatesJson, {'qualityId': qppItem.qualityId});
      var performanceRateInfo = _.find(performanceRateAdditionalJson, {'qualityId': qppItem.qualityId});

      if (!performanceRateDescription || !performanceRateInfo) {
        return measuresNotFound.push(qppItem.qualityId);
      }

      var strataDetails = [];
      performanceRateDescription.descriptions.forEach(function(description, index) {
        strataDetails.push({description: description, name: performanceRateInfo.performanceRates[index]});
      });

      qppJson[index].strata = strataDetails;
      qppJson[index].overallAlgorithm = performanceRateInfo.overallAlgorithm;

      if (performanceRateInfo.metricType) {
        qppJson[index].metricType = performanceRateInfo.metricType;
      }
    }
  });

  console.error('did not find measure details for the following', measuresNotFound);
  return JSON.stringify(qppJson, null, 2);
}
