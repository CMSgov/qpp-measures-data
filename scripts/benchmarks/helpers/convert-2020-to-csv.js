/* eslint no-cond-assign: off */

// Libraries
const parse = require('csv-parse');
const path = require('path');

const fs = require('fs');

const topline = 'Table 2: Historical MIPS Quality Measure Benchmark Results; created using PY2018 data and PY2020 Eligibility Rules,,,,,,,,,,,,,,,,,';
const secline = '\n' + 'Measure_Name,Measure_ID,Collection_Type,Measure_Type,High_Priority, Benchmark,Standard_Deviation,Average,Decile_3,Decile_4,Decile_5,Decile_6,Decile_7,Decile_8,Decile_9,Decile_10,TOPPED_OUT,SevenPointCap';
const output = [];
const convertedrecord = [];

// Create the parser
const parser = parse({
  delimiter: ',',
  from: 2,
  columns: true
});

// File containing source data to be converted
const sourceFile = path.resolve(__dirname, '../../../staging/2020/benchmarks/source.csv');
// File to write converted data to. If file does not exist, it will be created.
const targetFile = path.resolve(__dirname, '../../../staging/2020/benchmarks/benchmarks.csv');

// Load source data
try {
  const data = fs.readFileSync(sourceFile, 'utf8');
  parser.write(data);
  parser.end();
} catch (e) {
  console.log('Error loading source data for conversion:', e.stack);
}

// Read source data line by line and convert
parser.on('readable', function() {
  output.push(topline);
  output.push(secline);

  let record;

  while (record = parser.read()) {
    // Remove any carriage returns in measure title
    let measuretitle = record['Measure Title'].replace(/[\n\r]+/g, '');

    // Wrap in quotes, if any commas in measure title
    if (record['Measure Title'].indexOf(',') !== -1 && !record['Measure Title'].startsWith('"') && !record['Measure Title'].endsWith('"')) {
      measuretitle = '"' + measuretitle + '"';
    }

    // Wrap in quotes, if any quotes in measure title
    if (record['Measure Title'].charAt(0) === '"' && record['Measure Title'].charAt(record['Measure Title'].length - 1) === '"') {
      measuretitle = measuretitle.replace(/^"/, '').replace(/"$/, '');
    }

    if (record['Measure Title'].indexOf('"') !== -1) {
      measuretitle = '"' + measuretitle.replace(/"/g, '""') + '"';
    }

    convertedrecord.push(
      measuretitle,
      record['Measure ID'],
      record['Collection Type'].replace(/[\n\r]+/g, ''),
      record['Measure Type'].replace(/[\n\r]+/g, ''),
      record['Measure has a Benchmark'],
      '',
      record['Average Performance Rate'],
      record['Decile 3'],
      record['Decile 4'],
      record['Decile 5'],
      record['Decile 6'],
      record['Decile 7'],
      record['Decile 8'],
      record['Decile 9'],
      record['Decile 10'],
      record['Topped Out'],
      record['Seven Point Cap'],
      record['High Priority']
    );

    output.push('\n' + convertedrecord.toString());
    convertedrecord.length = 0;
  }
});

// Catch any parser error
parser.on('error', function(err) {
  console.error(err.message);
});

// Write converted data to target file
parser.on('end', function() {
  console.log(output.join(''));
  fs.writeFileSync(targetFile, output.join(''));
});
