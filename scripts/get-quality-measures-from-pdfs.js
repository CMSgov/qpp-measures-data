// running this will generate a file in measures/quality-performace-rates.json
// with the descriptions for each performance rate
// claims pdfs can be downloaded from https://qpp.cms.gov/docs/QPP_quality_measure_specifications.zip
// unzip and give the path to the Claims-Quality-Measures
// usage ./scripts/get-quality-measures-from-pdfs.js <path to folder of claims quality measures pdfs>

var _ = require('lodash');
var fs = require('fs');
var program = require('commander');
var pdfToText = require('pdf-to-text');
var p = require('path');

var folderPath = null;
var performanceRateJson = [];

function setPath(path) {
  folderPath = path;
}

program
  .version('0.0.1')
  .arguments('<path>')
  .action(setPath)
  .parse(process.argv);

if (!folderPath) {
  console.log('Missing required argument <path>');
  process.exit(1);
}

function cleanUpString(input) {
  var removeWords = ['OR', 'AND', 'Eligible clinicians should continue to report the measure as specified, with no additional steps needed to account for multiple performance rates.'];

  removeWords.forEach(function(word) {
    input = input.replace(word, '');
  });

  input = input.replace(/\n/g, ' ');

  return (input.replace(/\s\s+/g, ' ')).trim();
};

function getRates(path, cb) {
  pdfToText.pdfToText(path, function(err, data) {
    if (err) throw(err);

    var rateDescriptions = [];

    var found = data.match(/This measure will be calculated with (\d) performance rates\:/);

    if (!found) {
      // sometimes the phrase for a multi-performance rate is different
      found = data.match(/There are (\d) performance rates to be calculated/);
    }

    if (!found) {
      // only a single performace rate
      var rateRegex = /DESCRIPTION\:((.|\s)*?)INSTRUCTIONS\:/;
      var foundRate = data.match(rateRegex);

      rateDescriptions.push(cleanUpString(foundRate[1]));
    } else {
      // multi performance rate
      var numOfRates = found[1];

      var reportingStart = /REPORTING CRITERIA FOR THIS MEASURE:/;
      var reportingFound = data.match(reportingStart);
      if (reportingFound == null) {
        reportingFound = found;
      }

      var remainingFile = data.substring(reportingFound.index + reportingFound[0].length);
      // find the 1, see if a ) or a . comes after each performance rate number
      var firstPos = remainingFile.indexOf('1');
      var delineationChar = remainingFile[firstPos+1];

      for (var i = 1; i<=numOfRates; i++) {
        // look for the description between 1) and 2)
        var rateRegex = new RegExp(i + '\\' + delineationChar + '((.|\\s)*?)(' + (i+1)+ '\\' + delineationChar + '|Version 1\\.0)');

        if (i+1 > numOfRates) {
          // if this is the last rate, look for the description between x) and the ending phrases
          var endingPhrases = '(REPORTING CRITERIA|Measure Reporting:|Version 1\\.0|DENOMINATOR \\(REPORTING|The eligible clinician should submit data)'
          rateRegex = new RegExp(i +'\\' + delineationChar + '((.|\\s)*?)' + endingPhrases);
        }

        var foundRate = remainingFile.match(rateRegex);
        rateDescriptions.push(cleanUpString(foundRate[1]));
      }
    }

    cb(rateDescriptions);
  });
}

// find all files in path
// group the files by the qualityId. This way we don't have to look through the claims and registry files
var groupedFiles = fs.readdirSync(folderPath).reduce(function(arr, current) {
  var qualityId = current.split('_')[2];
  arr[qualityId] ? arr[qualityId].push(current) : arr[qualityId] = [current];
  return arr;
}, {});

var qualityIds = Object.keys(groupedFiles);
qualityIds.forEach(function(qualityId, i){
  getRates(p.join(folderPath, groupedFiles[qualityId][0]), function(rateDescriptions) {
    // push into performanceRateJson
    performanceRateJson.push({qualityId: qualityId, descriptions: rateDescriptions});

    if (performanceRateJson.length === qualityIds.length) {
      // sort all performance rates
      var sortedRates = _.sortBy(performanceRateJson, ['qualityId']);
      // write file to tmp
      fs.writeFile(p.join(__dirname, '../util/quality-performance-rates.json'), JSON.stringify(sortedRates, null, 2));
    }
  });
});

