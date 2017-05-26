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
  // read in util/ecqm-strata.json
  var ecqmStrataJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../util/ecqm-strata.json'), 'utf8'));

  var measuresNotFound = [];
  // iterate through all qppJson measures and find matching items from other json blobs
  qppJson.forEach(function(qppItem, index) {
    if (qppItem.category === 'quality') {
      var performanceRateDescription = _.find(performanceRatesJson, {'qualityId': qppItem.measureId});
      var performanceRateInfo = _.find(performanceRateAdditionalJson, {'qualityId': qppItem.measureId});

      if (!performanceRateDescription || !performanceRateInfo) {
        return measuresNotFound.push(qppItem.measureId);
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

  qppJson.forEach(function(qppItem, index) {
    if (qppItem.category === 'quality') {
      // add data from ecqm xml specifications
      const ecqmInfo = _.find(ecqmStrataJson, {'eMeasureId': qppItem.eMeasureId});
      if (ecqmInfo) {
        qppJson[index].eMeasureUuid = ecqmInfo.eMeasureUuid;
        qppJson[index].metricType = ecqmInfo.metricType;
        const oldStrata = qppJson[index].strata;

        // if none, just set it
        if (oldStrata.length === 0) {
          qppJson[index].strata = ecqmInfo.strata;
        } else { // otherwise preserve name but override description, uuids
          ecqmInfo.strata.forEach((newStratum, ecqmIndex) => {
            if (oldStrata[ecqmIndex]) {
              qppJson[index].strata[ecqmIndex].eMeasureUuids = newStratum.eMeasureUuids;
              qppJson[index].strata[ecqmIndex].description = newStratum.description;
            } else {
              qppJson[index].strata[ecqmIndex] = newStratum;
            }
          });
          if (oldStrata.length > 1) {
            // ASSUMPTION: strata already available are in the same order as the ones extracted from the xml files
            // @kencheeto: I think this is safe, since the ecqm strata fields already present in qppJson have at most one stratum
            console.warn(qppItem.eMeasureId, ': we are not guaranteed the same ordering, please double check these strata values in the diff');
          }
        }
      }
    }
  });

  return JSON.stringify(qppJson, null, 2);
}
