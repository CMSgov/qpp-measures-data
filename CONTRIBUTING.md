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

### Performance year

$YEAR refers to the performance year; this command-line argument is required.  $YEAR is currently only supported as a command-line argument for measures and benchmarks generation, not supported for clinical clusters.

### Generating data
To regenerate and validate data, do the following:

```
npm run build:measures $YEAR         # generates measures/$YEAR/measures-data.json
npm run build:benchmarks $YEAR       # generates benchmarks/$YEAR.json
npm run build:clinical-clusters # generates clinical-clusters/clinical-clusters.json
```

### Validation

We've provided a simple tool to validate JSON against our JSON schemas. By providing an argument to indicate the schema against which to validate, it can be used as follows:
```
cat [path to JSON] | node scripts/validate-data.js [measures | benchmarks | clinical-clusters] [$YEAR]
```
e.g. from the base directory:
```
cat measures/2018/measures-data.json  | node scripts/validate-data.js measures 2018
```
### Additional measures

`util/measures/qcdr-measures.csv` contains all the QCDR measure to be transformed into `measures/$YEAR/measures-data.json` by running `npm run build:measures`.

The csv is formatted for the script to run correctly. If the new version does not conform to how the csv is expected, it will cause the npm build step to fail. When your work is complete, make sure to send the updated `qcdr-measures-v<#>.csv` with a bumped version number back to PIMMS with instructions to use it as the base to make the next set of changes. The next person to update measures-data will thank you!

`cp` the new version of the CSV to `util/measures/qcdr-measures.csv`, run `npm run build:measures $YEAR`, and `git diff` to see changes are as expected to `measures/measures-data.json`.

#### Importing measures from CSV file

`scripts/measures/import-qcdr-measures.js` script handles importing QCDR measures from a CSV and converting them to the qpp-measures-data measure schema. The `convertCsvToMeasures` function can be replicated for new CSVs if appropriate.

### Additional benchmarks

For 2018-2019, only 'full images' of benchmark data are accepted; the csv must contain a full list of included benchmarks. Incremental files are no longer supported (2017 is no longer supported).

  To add or update benchmarks, rename your csv to 'benchmarks.csv'
  and place that file in staging/$YEAR/benchmarks/. 
  Replace any existing files of the same name.
  Run `npm run build:benchmarks $YEAR` to update benchmark JSON files under benchmarks/.
  $YEAR refers to the performance year you are looking to update. 
  See `build-benchmarks` for more detail.

  `build-benchmarks` will call `parse-benchmarks-data.js` directly and validate the data right after. 
  `parse-benchmarks-data.js` relies on a set of columns to be present and additional empty columns can cause the parsing to fail.
   See that file for additional instructions on how to generate the JSON file.
  
  Also, `parse-benchmarks-data.js` cross references for measureIds in `measures/$YEAR/measures-data.json` for the correct usage. If none are matched, either a padded `000` digit will be used for `measureId`s with all digits or a non-spaced version of the `measureId` will be used.

  If 2 benchmarks have the same Measure ID, Benchmark Year, Performance Year, and Submission method, an error will be thrown. Benchmarks cannot share this composite key.

  Please verify the changes are as expected. (You can run `git diff`.)

### Deleting measures and benchmarks

TODO: Support a safer way to delete benchmarks. You could add a key saying `delete: true` and have the generate step filter out benchmarks with those keys. This way you wouldn't change the generation artifacts.

## Testing

When making changes to measures-data, include tests in the tests directory and make sure existing tests still pass using:

```
npm test
```

We also use Travis CI to run tests on every branch.

## Versioning, publishing, and creating new releases

1. Bump the `version` using `npm version <patch | minor | major>` when making changes to anything other than comments/documentation. Use `minor` when making changes to datasets (e.g. `measures/$YEAR/measures-data.json` or `benchmarks/$YEAR.json`), or `patch` otherwise.

2. Publish a new version after bumping the version number:
```
npm login # as cmsgov
npm publish
```

3. [Create a release](https://github.com/CMSgov/qpp-measures-data/releases) in Github after the new version is published.
  - The tag version should be 'v[version of module just published]', e.g. 'v1.0.0-alpha.1'. (Note the `v` prefix).
  - The release title should be a short description of the release contents.
  - The release notes should contain appropriate, standardized headers like "Added", "Changed", "Removed", "Fixed", and relevant details.
  - Please read [the standards](http://keepachangelog.com/en/0.3.0/) prior to creating release notes.

## Licenses

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
