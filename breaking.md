# v8.0.0

This update adds strongly-typed return values to our package functions. This will impact TypeScript users who reference the qpp-measures-repo getter functions. This will not impact JavaScript users or anyone who bypasses the getter functions by referencing the package JSON files directly (not recommended).

We recommend updating as soon as possible, since future data changes will be in later versions building off of these updates. Actual function return data formatting is not changing, but the addition of strict typing will likely require some changes to your code to support it.

## 🔴 BREAKING CHANGES 🔴

This update adds typed return values to our package functions, which means your code will start erroring if it is expecting differently-formatted responses than our new types. We recommend looking through the following table for the functions your code references and refactoring to use our new types in your code.

### Return Type Format Table

<table>
<tr>
<td> Function Name </td> <td> Return Object/Value </td> <td> Return Type Interface </td>
</tr>
<tr>
<td> getValidPerformanceYears </td> <td> 

```typescript
number[]
```

</td> 
<td> 

```typescript
number[]
```

</td>
</tr>
<tr>
<td> getProgramNames </td>
<td> 

```typescript
{
    "mips": "mips",
    "cpcPlus": "cpcPlus",
    "pcf": "pcf",
    "app1": "app1",
    "DEFAULT": "mips",
    "G0053": "G0053",
    "G0054": "G0054",
    "G0055": "G0055",
    "G0056": "G0056",
    "G0057": "G0057",
    "G0058": "G0058",
    "G0059": "G0059",
    "M0001": "M0001",
    "M0005": "M0005",
    "M0002": "M0002",
    "M0003": "M0003",
    "M0004": "M0004",
    "M1366": "M1366",
    "M1367": "M1367",
    "M1368": "M1368",
    "M1369": "M1369",
    "M1370": "M1370"
}
```

Note: The `ProgramNames` interface, features key-value pairs for all possible programs names. Depending on how your specific TS application is using this interface, it is possible you'll need to use the `keyof` operator to enforce strict typing. See documentation on `keyof` operator [here](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html).

</td> <td> ProgramNames </td>
</tr>
<tr>
<td> getBenchmarksData </td> <td>

```typescript
{ [year: number]: {
  measureId: string;
  benchmarkYear: number;
  performanceYear: number;
  submissionMethod: string;
  isToppedOut?: boolean;
  isHighPriority?: boolean;
  isInverse?: boolean;
  metricType?: string;
  isToppedOutByProgram?: boolean;
  percentiles?: {
        "1": number;
        "10": number;
        "20": number;
        "30": number;
        "40": number;
        "50": number;
        "60": number;
        "70": number;
        "80": number;
        "90": number;
        "99": number;
    };
  deciles?: number[];
  averagePerformanceRate?: number;
}[];
}
```

</td> <td> BenchmarksData </td>
<tr>
<td> getBenchmarksYears </td>
<td> 

```typescript
number[]
```

</td> <td> 

```typescript
number[]
```

</td>
</tr>
<tr>
<td> getBenchmarksExclusionReasons </td>
<td> 

```typescript
{
    measureId: string;
    submissionMethod: string;
    performanceYear: number;
    benchmarkYear: number;
    reasonCodes: string[];
    reasonDescriptions: string[];
}[]
```

</td> <td> BenchmarksExclusionReasons[] </td>
</tr>
<tr>
<td> getBenchmarksNationalAverages </td>
<td> 

```typescript
{
    measureId: string;
    performanceYear: number;
    benchmarkYear: number;
    groupNationalAverage: number;
    individualNationalAverage: number;
}[]
```

</td> <td> CostNationalAverage </td>
</tr>
<tr>
<td> getMeasuresData </td>
<td> 

The data type is to large and branching to document here, the link included shows the entire type structure. We also expose the individual measure types to use throughout your code:
https://github.com/CMSgov/qpp-measures-data/blob/develop/util/interfaces/measure.ts


</td> <td> Measure </td>
</tr>
<tr>
<td> getClinicalClusterData </td>
<td> 

```typescript
{
    measureId: string;
    submissionMethod: string;
    firstPerformanceYear: number;
    lastPerformanceYear: number | null;
    specialtySets?: {
        name: string;
        measureIds: string[];
    };
    clinicalClusters?: {
        name: string;
        measureIds: string[];
    };
}[]
```

</td> <td> ClinicalCluster </td>
</tr>
<tr>
<td> getMVPData </td>
<td> 

```typescript
{
    mvpId: string;
    clinicalTopic: string;
    title: string;
    description: string;
    specialtiesMostApplicableTo: string[];
    clinicalTopics: string;
    hasCahps: boolean;
    hasOutcomeAdminClaims: boolean;
    qualityMeasures: QualityMeasure[];
    iaMeasures: IAMeasure[];
    costMeasures: AggregateCostMeasure[];
    foundationPiMeasures: PIMeasure[];
    foundationQualityMeasures: QualityMeasure[];
    administrativeClaimsMeasures: QualityMeasure[];
}[]
```

</td> <td> MVPData </td>
</tr>
<tr>
<td> getMVPDataSlim </td>
<td> 

```typescript
{
    mvpId: string;
    clinicalTopic: string;
    title: string;
    description: string;
    specialtiesMostApplicableTo: string[];
    clinicalTopics: string;
    hasCahps: boolean;
    hasOutcomeAdminClaims: boolean;
    qualityMeasures: string[];
    iaMeasures: string[];
    costMeasures: string[];
    foundationPiMeasures: string[];
    foundationQualityMeasures: string[];
    administrativeClaimsMeasures: string[];
}[]
```

</td> <td> MVPDataSlim </td>
</tr>
</table>

### Using the Types/Interfaces in Your Code

We use interfaces to define the return values. To access the new interfaces, you can use the following import path.

```typescript
// to get specific interfaces.
import { ProgramNames, IAMeasure } from 'qpp-measures-data/util/interfaces/index';
// to get all interfaces.
import * as MeasuresRepoInterfaces from 'qpp-measures-data/util/interfaces/index';
```
