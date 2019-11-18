const fs = require('fs');
const path = require('path');

const outputPath = process.argv[process.argv.length - 1];

function mergeMeasures() {
  const allJson = [];
  // Iterate through each measures file provided as a command-line argument
  // and add it to the allJson array as an array of measure (json) objects.
  // The first command-line argument starts at position 2, last argument
  // is the output path. everything in between is an input measures file
  for (let i = 2; i < process.argv.length - 1; i++) {
    const measureStagingPath = path.join(__dirname, process.argv[i]);
    const measureJson = JSON.parse(fs.readFileSync(measureStagingPath, 'utf8'));
    allJson.push(measureJson);
  }

  // Merge the nested-array-per-measures-file into a single array of measures
  const combinedMeasures = [].concat(...allJson);
  const combinedJson = JSON.stringify(combinedMeasures, null, 2);
  fs.writeFileSync(path.join(__dirname, outputPath), combinedJson);
}

mergeMeasures();
