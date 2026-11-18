# Performance Year 2027 Data

**All Measure and Benchmark data for Performance Year 2027 is currently in progress and is subject to change.**

# qpp-measures-data

## Quality Payment Program Measures Data Repository

This is the source of truth for QPP measures data. Stability in the API contract for qpp-measures-data is prioritized but not guaranteed.

## How to Use qpp-measures-data

Measures and benchmark data can be accessed by installing the `qpp-measures-data` NPM repository.

The measures data JSON schema is described in `measures/$YEAR/measures-schema.yaml`; $YEAR refers to the performance year. The measures data here combines existing data from the QPP API, with supplementary data found in `util`. To access measures data without installing the NPM repository, run `git clone git@github.com:CMSgov/qpp-measures-data.git` and navigate to `measures/$YEAR/measures-data.json`.

The benchmarks data JSON schema is described in `benchmarks/benchmarks-schema.yaml`.

To access the benchmarks data without installing the NPM repository, run `git clone git@github.com:CMSgov/qpp-measures-data.git` and navigate to `benchmarks/`. Benchmarks data is organized by performance year. For example, `benchmarks/2017.json` contains the benchmarks for performance year 2017
(benchmark year 2015).

### Importing the qpp-measures-data module

Functions take a string version argument and return the appropriate YAML schema or JSON data.

The module can be used with the following pattern:

```typescript
import * as qppMeasuresData from 'qpp-measures-data';
const measuresData = qppMeasuresData.getMeasuresData($YEAR);
const measuresSchema = qppMeasuresData.getMeasuresSchema($YEAR);
const benchmarksData = qppMeasuresData.getBenchmarksData();
const benchmarkData$YEAR = benchmarksData[$YEAR];
const benchmarksSchema = qppMeasuresData.getBenchmarksSchema();
const benchmarksCostNationalAveragesData = qppMeasuresData.getBenchmarksNationalAverages($YEAR);
const benchmarksCostNationalAveragesSchema = qppMeasuresData.getBenchmarksNationalAveragesSchema($YEAR);
// Note: for the following function, the mvpIds is an optional parameter (array of MVP IDs to filter by)
const mvpData = qppMeasuresData.getMVPData($YEAR, mvpIds);
const mvpSchema = qppMeasuresData.getMVPSchema($YEAR);
```

We elso export common data types such as Measures and Benchmarks. You can view the list of these in util/interfaces/index.ts.

### Core Measures

Starting with performance year 2027, a Core Measure replaces the High Priority requirement in the Quality category.
- Quality measures no longer have `isHighPriority`. Instead, every quality measure has `isCoreMeasure` (boolean) and `coreMeasureFor` (the MVP IDs for which the measure is a Core Measure; `[]` when none).
- `getMVPData($YEAR)` returns the same MVP shape as earlier years; its quality measures carry `isCoreMeasure` and `coreMeasureFor`. To check whether a measure is a Core Measure for a given MVP, use `measure.coreMeasureFor.includes(mvp.mvpId)`.
- `getMVPDataSlim($YEAR)` (from `mvp.json`) also includes `coreQualityMeasureIds` for each MVP.
- Data for performance year 2026 and earlier is unchanged and still uses `isHighPriority`. In the exported TypeScript types, `isHighPriority`, `isCoreMeasure`, and `coreMeasureFor` are optional so one type covers every year.

## Contributing

Before creating pull requests, please make sure to review
[CONTRIBUTING.md](CONTRIBUTING.md).
