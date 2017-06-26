/**
 * Will merge two benchmark json files into a single array.
 * usage : node merge-benchmarks.js ./a.json ./b.json
 *
 * Created by Biju Joseph on 6/26/17.
 */

// obtain the files to merge
var file1 = process.argv[2];
var file2 = process.argv[3];

// load the file contents
var benchmarks1 = require(file1);
var benchmarks2 = require(file2);

// merge the files & output the content.
var merged = benchmarks1.concat(benchmarks2);
console.log(JSON.stringify(merged, null, 2));