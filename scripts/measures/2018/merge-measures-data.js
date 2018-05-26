const fs = require('fs');
const path = require('path');

const outputPath = process.argv[4];

function mergeMeasures() {
  const allJson = [];
  // first command-line argument starts at position 2, last argument
  // is the output path. everything in between is an input measures file
  for (let i = 2; i < process.argv.length - 1; i++) {
    const measureStagingPath = path.join(__dirname, process.argv[i]);
    const measureJson = JSON.parse(fs.readFileSync(measureStagingPath, 'utf8'));
    allJson.push(measureJson);
  }

  const combinedMeasures = [].concat(...allJson);
  const combinedJson = JSON.stringify(combinedMeasures, null, 2);
  fs.writeFileSync(path.join(__dirname, outputPath), combinedJson);
}

mergeMeasures();
