// running this will print out whether each measure is an inverse measure
// claims pdfs can be downloaded from https://qpp.cms.gov/docs/QPP_quality_measure_specifications.zip
// unzip and give the path to the Claims-Registry-Measures directory
// usage ./get-inverse-measures-from-pdfs.js <path to folder of Claims-Registry-Measures pdfs>

const fs = require('fs');
const program = require('commander');
const pdfToText = require('pdf-to-text');
const p = require('path');

const outputPath = '../../util/measures/inverse-measures.json';

let folderPath = null;

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

function getIsInverse(path, cb) {
  pdfToText.pdfToText(path, function(err, data) {
    let isInverse = false;

    if (err) {
      console.log('Error processing PDF: ' + path + ' - ' + err);
      cb(isInverse);
      return;
    }

    const found = data.match(/inverse measure/i); // ignore case

    if (found) {
      isInverse = true;
    }

    cb(isInverse);
  });
}

// find all files in path
// group the files by the qualityId. This way we don't have to look through the claims and registry files
const groupedFiles = fs.readdirSync(folderPath).reduce(function(arr, current) {
  const qualityId = current.split('_')[2];
  arr[qualityId] ? arr[qualityId].push(current) : arr[qualityId] = [current];
  return arr;
}, {});

const qualityIds = Object.keys(groupedFiles);
const output = {};

qualityIds.forEach(function(qualityId, i) {
  getIsInverse(p.join(folderPath, groupedFiles[qualityId][0]), function(isInverse) {
    output[qualityId] = isInverse;
  });
});

// the PDF processing package we are using is async but doesn't support promises, so there's no intelligent
// way to wait for it to finish. This will write the output after ten seconds.
// TODO switch to a promise-supporting PDF package
setTimeout(function() {
  fs.writeFileSync(p.join(__dirname, outputPath), JSON.stringify(output, null, 2));
}, 10000);
