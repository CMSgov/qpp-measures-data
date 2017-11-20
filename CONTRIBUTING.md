# Contribution Guidelines

## Getting Started

Install the following homebrew dependencies:
```
brew install jq wget poppler
```

Run:
```
npm install
```

Make changes on a feature branch, then open a pull request. Make sure CI passes on your branch, and you include any relevant new tests.

### Generating data
To regenerate and validate data, do the following:

```
npm run build:measures          # generates measures/measures-data.json and measures/measures-data.xml
npm run build:benchmarks        # generates benchmarks/2017.json
npm run build:clinical-clusters # generates clinical-clusters/clinical-clusters.json
```

### Validation

We've provided a simple tool to validate JSON against our JSON schemas. By providing an argument to indicate the schema against which to validate, it can be used as follows:
```
cat [path to JSON] | node scripts/validate-data.js [measures | benchmarks | clinical-clusters]
```

### Additional measures

`util/measures/additional-measures.json` includes data objects which are necessary for scoring but are not MIPS measures. Any additional measures should be added to this file, followed by a re-generation of measures data using the command described in the "Generating Data" section.

At this time `util/measures/additional-measures.json` includes:

1. **Attestations:** Attestations are pre-requisites of submitting additional measurements for a given category.
2. **Exclusions:** Exclusions are optional attestations of conditions which exempt the provider from a corresponding (required) measure. For example, submitting `true` to `ACI_LVPP_1` exempts a user from submitting data for the required measure `ACI_EP_1`.

Similarly, `util/benchmarks/additional-benchmarks-2017.json` contains benchmark data that is necessary for scoring but not included in the historical CSV file. Any additional benchmarks should be added to this file, followed by a re-generation of benchmarks data.

#### Importing measures from CSV file

`scripts/measures/import-qcdr-measures.js` script handles importing QCDR measures from a CSV and converting them to the qpp-measures-data measure schema. The `convertCsvToMeasures` function can be replicated for new CSVs if appropriate.

### Additional benchmarks

To add or update benchmarks, you'll want to convert the csv file into JSON with the `scripts/benchmarks/parse-benchmarks-data.js`. `parse-benchmarks-data.js` relies on a set of columns to be present and additional empty columns can cause the parsing to fail. See that file for additional instructions on how to generate the JSON file.
Also, `parse-benchmarks-data.js` cross references for measureIds in `measures/measures-data.json` for the correct usage. If none are matched, either a padded `000` digit will be used for `measureId`s with all digits or a non-spaced version of the `measureId` will be used.

After you have the parsed JSON file, move the CSV and JSON into `staging/benchmarks/csv` and `staging/benchmarks/json`. We do this for auditing and regeneration purposes. You'll notice a number prepended to both files. We number each file to enforce ordering of merges. Currently, if two benchmarks have the same Measure ID, Benchmark Year, Performance Year, and Submission method, the one that exists in the larger numbered file will overwrite the smaller one.

To update the benchmarks file after the JSON file is in place, run `npm run build:measures` and verify the changes are as expected. (You can run `git diff`.)

### Deleting measures and benchmarks

TODO: Support a safer way to delete benchmarks. You could add a key saying `delete: true` and have the generate step filter out benchmarks with those keys. This way you wouldn't change the generation artifacts.

## Testing

When making changes to measures-data, include tests in the tests directory and make sure existing tests still pass using:

```
npm test
```

We also use Travis CI to run tests on every branch.

## Versioning, publishing, and creating new releases

1. The `version` in `package.json` must be bumped when making changes to `measures/measures-data.json` or `benchmarks/2017.json`

2. To publish a new version after bumping the version number:
```
npm login # as cmsgov
npm publish
```

3. After the new version is published, create a release in Github titled 'v[version of module just published]', e.g. 'v1.0.0-alpha.1'. The release notes should contain appropriate, standardized headers like "Added", "Changed", "Removed", "Fixed", and relevant details. Please read [the standards](http://keepachangelog.com/en/0.3.0/) prior to creating release notes.

## Licenses

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
