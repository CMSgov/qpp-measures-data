/* eslint no-cond-assign: off */

// Libraries
const parse = require('csv-parse');
const path = require('path');

const fs = require('fs');

const topline = 'Table 2: Historical MIPS Quality Measure Benchmark Results; created using PY2017 data and PY2020 Eligibility Rules,,,,,,,,,,,,,,,,,';
const secline = '\n' + 'Measure_Name,Measure_ID,Collection_Type,Measure_Type,Benchmark,Standard_Deviation,Average,Decile_3,Decile_4,Decile_5,Decile_6,Decile_7,Decile_8,Decile_9,Decile_10,TOPPED_OUT,SevenPointCap,HighPriority';
const output = [];
const convertedrecord = [];

// Create the parser
const parser = parse({
  delimiter: ',',
  from: 1,
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
  let record;

  while (record = parser.read()) {
    // Remove any carriage returns in measure title
    let measuretitle = record['Measure_Name'].replace(/[\n\r]+/g, '');

    // Wrap in quotes, if any commas in measure title
    if (record['Measure_Name'].indexOf(',') !== -1 && !record['Measure_Name'].startsWith('"') && !record['Measure_Name'].endsWith('"')) {
      measuretitle = '"' + measuretitle + '"';
    }

    // Wrap in quotes, if any quotes in measure title
    if (record['Measure_Name'].charAt(0) === '"' && record['Measure_Name'].charAt(record['Measure_Name'].length - 1) === '"') {
      measuretitle = measuretitle.replace(/^"/, '').replace(/"$/, '');
    }

    if (record['Measure_Name'].indexOf('"') !== -1) {
      measuretitle = '"' + measuretitle.replace(/"/g, '""') + '"';
    }

    convertedrecord.push(
      measuretitle,
      record['Measure_ID'],
      record['Collection_Type'].replace(/[\n\r]+/g, ''),
      record['Measure_Type'].replace(/[\n\r]+/g, ''),
      record['Benchmark'],
      '',
      record['Average'],
      record['Decile_3'],
      record['Decile_4'],
      record['Decile_5'],
      record['Decile_6'],
      record['Decile_7'],
      record['Decile_8'],
      record['Decile_9'],
      record['Decile_10'],
      record['TOPPED_OUT'] === 'Y' ? 'Yes' : 'No',
      record['SevenPointCap'] === 'Y' ? 'Yes' : 'No',
      record['High_Priority'] === 'Y' ? 'Y' : 'N'
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
  output.unshift(secline);
  output.unshift(topline);
  fs.writeFileSync(targetFile, output.join(''));
});
