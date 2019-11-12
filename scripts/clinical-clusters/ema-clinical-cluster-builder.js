/**
 * Will create Eligibility Measure Applicability JSON representation for measures.
 * An example data may look like this:
 *
 * [
 *  {
 *    "measureId" : "046",
 *    "firstPerformanceYear": 2017,
 *    "lastPerformanceYear": null,
 *    "submissionMethod" : "registry",
 *    "specialtySets": [
 *        {name:"generalOncology", "measureIds": ["047","130","317","226","250"] }
 *    ],
 *    "clinicalClusters": [
 *        {"name" : "diabeticCare", "measureIds": ["001", "117", "128"] }
 *   ]
 *  }
 * ]
 */
const fs = require('fs');
const _ = require('lodash');
const parse = require('csv-parse/lib/sync');

const MAX_SPECIALITY_SET_SIZE = 6;
const SUPPORTED_PERFORMANCE_YEARS = [2017, 2018, 2019];

let measuresJson = '';
const performanceYear = parseInt(process.argv[2], 10);
const claimsClusterFilePath = process.argv[3];
const registryClusterFilePath = process.argv[4];

const specialSpecialtySetRelations = {
  2017: {
    claims: [],
    registry: []
  },
  2018: {
    claims: [
      { name: 'anesthesiology', action: 'replace', measureIds: ['076', '130', '317'] },
      { name: 'dermatology', action: 'replace', measureIds: ['130', '226', '317'] },
      { name: 'rheumatology', action: 'add', measureIds: ['047', '128', '130', '226', '317'] },
      { name: 'neurosurgical', action: 'replace', measureIds: ['021', '023', '130', '226'] }
    ],
    registry: [
      { name: 'dentistry', action: 'remove', measureIds: ['378', '379'] }
    ]
  },
  2019: {
    claims: [],
    registry: []
  }
};

const specialClusterRelations = {
  2017: {
    claims: [
      {measureId: '130', optionals: []},
      {measureId: '226', optionals: []},
      {measureId: '317', optionals: []},
      {measureId: '117', optionals: []},
      {measureId: '112', optionals: ['113']},
      {measureId: '113', optionals: ['112']}
    ],
    registry: [
      {measureId: '047', optionals: []},
      {measureId: '110', optionals: []},
      {measureId: '130', optionals: []},
      {measureId: '134', optionals: []},
      {measureId: '226', optionals: []},
      {measureId: '317', optionals: []},
      {measureId: '424', optionals: []},
      {measureId: '430', optionals: []},
      {measureId: '051', optionals: ['052']},
      {measureId: '052', optionals: ['051']},
      {measureId: '398', optionals: ['444']},
      {measureId: '444', optionals: ['398']},
      {measureId: '024', optionals: ['418']},
      {measureId: '418', optionals: ['024']},
      {measureId: '005', optionals: ['008']},
      {measureId: '006', optionals: ['118', '007']},
      {measureId: '007', optionals: ['118', '006']},
      {measureId: '008', optionals: ['005']},
      {measureId: '118', optionals: ['007', '006']},
      {measureId: '426', optionals: ['427']},
      {measureId: '427', optionals: ['426']},
      {measureId: '112', optionals: ['113']},
      {measureId: '113', optionals: ['112']}
    ]
  },
  2018: {
    claims: [
      {measureId: '130', optionals: []},
      {measureId: '317', optionals: []},
      {measureId: '117', optionals: []},
      {measureId: '226', optionals: []},
      {measureId: '112', optionals: ['113']},
      {measureId: '113', optionals: ['112']}
    ],
    registry: [
      {measureId: '110', optionals: []},
      {measureId: '130', optionals: []},
      {measureId: '226', optionals: []},
      {measureId: '424', optionals: []},
      {measureId: '430', optionals: []},
      {measureId: '317', optionals: []},
      {measureId: '134', optionals: []},
      {measureId: '051', optionals: ['052']},
      {measureId: '052', optionals: ['051']},
      {measureId: '398', optionals: ['444']},
      {measureId: '444', optionals: ['398']},
      {measureId: '024', optionals: ['418']},
      {measureId: '418', optionals: ['024']},
      {measureId: '006', optionals: ['118', '007']},
      {measureId: '007', optionals: ['118', '006']},
      {measureId: '118', optionals: ['007', '006']},
      {measureId: '005', optionals: ['008']},
      {measureId: '008', optionals: ['005']},
      {measureId: '112', optionals: ['113']},
      {measureId: '113', optionals: ['112']}
    ]
  },
  2019: {
    claims: [
      {measureId: '117', optionals: []},
      {measureId: '130', optionals: []},
      {measureId: '226', optionals: []},
      {measureId: '317', optionals: []}
    ],
    registry: [
      {measureId: '110', optionals: []},
      {measureId: '130', optionals: []},
      {measureId: '226', optionals: []}
    ]
  }
};

// Handle exceptions to standard populateSpecialtySet logic with manual overrides
function curateSpecialtySet(clusterMap, relations) {
  if (relations) {
    relations.forEach(r => {
      if (r.action === 'remove') { // remove specialty set from output
        r.measureIds.forEach(m => {
          const specialtySets = clusterMap.get(m).specialtySets;
          const specialtySetIndex = specialtySets.findIndex(ss => ss.name === r.name);
          specialtySets.splice(specialtySetIndex, 1);
        });
      } else if (r.action === 'replace') { // replace an existing specialty set with a new set of measures
        r.measureIds.forEach(m => {
          const specialtySets = clusterMap.get(m).specialtySets;
          const specialtySetIndex = specialtySets.findIndex(ss => ss.name === r.name);
          specialtySets.splice(specialtySetIndex, 1);
          specialtySets.push({name: r.name, measureIds: r.measureIds});
        });
      } else if (r.action === 'add') { // add a new specialty set to output
        r.measureIds.forEach(m => {
          const specialtySets = clusterMap.get(m).specialtySets;
          specialtySets.push({name: r.name, measureIds: r.measureIds});
        });
      }
    });
  }
}

// Handle exceptions to standard populateClinicalClusters logic with manual overrides
function curateClinicalClusters(clusterMap, relations) {
  // remove clinicalClusters from measures that belongs to multiple cluster
  relations
    .filter(r => r.optionals.length === 0)
    .forEach(r => delete clusterMap.get(r.measureId).clinicalClusters);

  // remove measures in clinicalClusters that are optional
  relations
    .filter(r => r.optionals.length > 0)
    .forEach(r => {
      clusterMap.get(r.measureId).clinicalClusters
        .forEach(c => {
          c.measureIds = c.measureIds.filter(measureId => r.optionals.indexOf(measureId) < 0);
        });
    });

  // remove clusters that do not have specialtySet or clinicalClusters
  Array.from(clusterMap.values())
    .filter(cluster => _.isEmpty(cluster.clinicalClusters) && _.isEmpty(cluster.specialtySets))
    .forEach(cluster => clusterMap.delete(cluster.measureId));
}

function populateClinicalClusters(clusterMap, measures, submissionMethod, filePath) {
  const contents = fs.readFileSync(filePath, 'utf8');
  const rows = parse(contents, {columns: true});

  // group the measures by cluster
  const byClusterName = _.chain(rows)
    .map(r => ({clusterName: _.camelCase(r['Title']), measureId: _.padStart(r['Quality ID'], 3, '0')}))
    .groupBy('clusterName')
    .map((val, key) => ({name: key, measureIds: val.map(m => m.measureId)}))
    .value();

  // read the grouped measures and populate the cluster name
  byClusterName.forEach(clinicalCluster => {
    clinicalCluster.measureIds.forEach(measureId => {
      const measure = measures.find(m => m.measureId === measureId);
      const cluster = clusterMap.get(measureId) || {
        measureId: measureId,
        submissionMethod: submissionMethod,
        firstPerformanceYear: measure.firstPerformanceYear,
        lastPerformanceYear: measure.lastPerformanceYear
      };
      cluster['clinicalClusters'] = cluster['clinicalClusters'] || [];
      cluster['clinicalClusters'].push(clinicalCluster);
      clusterMap.set(measureId, cluster);
    });
  });
}

function populateSpecialtySet(clusterMap, measures, submissionMethod) {
  // group the measures of submissionMethod by specialty set
  const bySpecialty = _.chain(measures)
    .filter(m => m.category === 'quality')
    .filter(m => m.submissionMethods && m.submissionMethods.indexOf(submissionMethod) > -1)
    .flatMap(m => m.measureSets.map(specialty => Object.assign({specialty: specialty}, m)))
    .groupBy('specialty')
    .map((val, key) => ({name: key, measureIds: val.map(m => m.measureId)}))
    .value();

  // read the grouped measures and populate the specialty set on each
  bySpecialty.forEach(specialty => {
    if (specialty.measureIds.length < MAX_SPECIALITY_SET_SIZE) {
      specialty.measureIds.forEach(measureId => {
        const measure = measures.find(m => m.measureId === measureId);
        const cluster = clusterMap.get(measureId) || {
          measureId: measureId,
          submissionMethod: submissionMethod,
          firstPerformanceYear: measure.firstPerformanceYear,
          lastPerformanceYear: measure.lastPerformanceYear
        };
        cluster['specialtySets'] = cluster['specialtySets'] || [];
        cluster.specialtySets.push(specialty);
        clusterMap.set(measureId, cluster);
      });
    }
  });
}

function generateEMAClusters(allMeasures) {
  const measures = allMeasures.filter(m =>
    (SUPPORTED_PERFORMANCE_YEARS.indexOf(m.firstPerformanceYear) > -1) &&
    (m.lastPerformanceYear == null || SUPPORTED_PERFORMANCE_YEARS.indexOf(m.lastPerformanceYear) > -1)
  );

  const claimsClusterMap = new Map();
  const registryClusterMap = new Map();

  // set the claims and registry specialty set
  populateSpecialtySet(claimsClusterMap, measures, 'claims');
  populateSpecialtySet(registryClusterMap, measures, 'registry');

  curateSpecialtySet(claimsClusterMap, specialSpecialtySetRelations[performanceYear].claims);
  curateSpecialtySet(registryClusterMap, specialSpecialtySetRelations[performanceYear].registry);

  populateClinicalClusters(claimsClusterMap, measures, 'claims', claimsClusterFilePath);
  populateClinicalClusters(registryClusterMap, measures, 'registry', registryClusterFilePath);

  curateClinicalClusters(claimsClusterMap, specialClusterRelations[performanceYear].claims);
  curateClinicalClusters(registryClusterMap, specialClusterRelations[performanceYear].registry);

  const emaClusters = [];

  claimsClusterMap
    .forEach(v => emaClusters.push(v));

  registryClusterMap
    .forEach(v => emaClusters.push(v));

  // add the current measure to the cluster
  emaClusters.forEach(ema => {
    if (ema.clinicalClusters) {
      const clinicalClusters = [];
      ema.clinicalClusters.forEach(cc => {
        const cluster = Object.assign({}, cc, {measureIds: cc.measureIds.concat([ema.measureId])});
        clinicalClusters.push(cluster);
        cluster.measureIds = _.uniq(cluster.measureIds);
      });
      ema.clinicalClusters = clinicalClusters;
    }
  });

  // print the JSON back to the stream
  process.stdout.write(JSON.stringify(emaClusters, null, 2));
}

process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    measuresJson += chunk;
  }
});

process.stdin.on('end', () => {
  generateEMAClusters(JSON.parse(measuresJson, 'utf8'));
});
