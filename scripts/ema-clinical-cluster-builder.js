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
 *    "specialitySets": [
 *        {name:"generalOncology", "measureIds": ["047","130","317","226","250"] }
 *    ],
 *    "clinicalClusters": [
 *        {"name" : "diabeticCare", "measureIds": ["001", "117", "128"] }
 *   ]
 *  }
 * ]
 */
var fs = require('fs');
var _ = require('lodash');
var parse = require('csv-parse/lib/sync');

var MAX_SPECIALITY_SET_SIZE = 6;

var json = '';
var claimsClusterFilePath = process.argv[2];
var registryClusterFilePath = process.argv[3];

var specialClusterRelations = {
    registry: [
        {measureId: '047', optionals: []},
        {measureId: '110', optionals: []},
        {measureId: '130', optionals: []},
        {measureId: '134', optionals: []},
        {measureId: '226', optionals: []},
        {measureId: '317', optionals: []},
        {measureId: '424', optionals: []},
        {measureId: '430', optionals: []},
        {measureId: '051',  optionals: ['52']},
        {measureId: '052',  optionals: ['51']},
        {measureId: '398',  optionals: ['444']},
        {measureId: '444',  optionals: ['398']},
        {measureId: '024',  optionals: ['418']},
        {measureId: '418',  optionals: ['024']},
        {measureId: '006',  optionals: ['118', '007']},
        {measureId: '007',  optionals: ['118', '006']},
        {measureId: '118',  optionals: ['007', '006']},
        {measureId: '426',  optionals: ['427']},
        {measureId: '427',  optionals: ['426']},
        {measureId: '112',  optionals: ['113']},
        {measureId: '113',  optionals: ['112']},

    ],
    claims: [
        {measureId: '130', optionals: []},
        {measureId: '226', optionals: []},
        {measureId: '317', optionals: []},
        {measureId: '112',  optionals: ['113']},
        {measureId: '113',  optionals: ['112']}
    ]
};

function curate(clusterMap, relations) {
    // remove clincalClusters from measures that belongs to multiple cluster
    _.chain(relations)
        .filter(r => r.optionals.length === 0)
        .forEach(r => delete clusterMap.get(r.measureId).clinicalClusters);

    // remove measures in clincalClusters that are optional
    _.chain(relations)
        .filter(r => r.optionals.length > 0)
        .forEach(r => {
            clusterMap.get(r.measureId).clinicalClusters
                .forEach(c => c.measureIds = c.measureIds.filter(measureId  => r.optionals.indexOf(measureId) < 0))
        });

    // remove clusters that do not have specialitySet or clinicalClusters
    _.chain(clusterMap.values())
        .filter(cluster => _.isEmpty(cluster.clinicalClusters) && _.isEmpty(cluster.specialitySets))
        .forEach(cluster => clusterMap.delete(cluster.measureId))
}

function populateClinicalClusters(clusterMap, measures, submissionMethod, filePath) {
    let contents = fs.readFileSync(filePath, 'utf8');
    let rows = parse(contents, {columns: true});

    //group the measures by cluster
    let byClusterName = _.chain(rows)
        .map(r => ({clusterName: _.camelCase(r['Title']), measureId: _.padStart(r['Quality ID'], 3, '0')}))
        .groupBy('clusterName')
        .map((val, key) => ({name: key, measureIds: val.map(m => m.measureId)}))
        .value();

    // read the grouped measures and populate the cluster name
    byClusterName.forEach(clinicalCluster => {
        clinicalCluster.measureIds.forEach(measureId => {
            let measure = measures.find(m => m.measureId === measureId);
            let cluster = clusterMap.get(measureId) || {
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

function populateSpecialitySet(clusterMap, measures, submissionMethod) {

    // group the measures of submissionMethod by speciality set
    let bySpeciality = _.chain(measures)
        .filter(m => m.category === 'quality')
        .filter(m => m.submissionMethods && m.submissionMethods.indexOf(submissionMethod) > -1)
        .flatMap(m => m.measureSets.map(speciality => Object.assign({speciality: speciality}, m)))
        .groupBy('speciality')
        .map((val, key) => ({name: key, measureIds: val.map(m => m.measureId)}))
        .value();


    // read the grouped measures and populate the speciality set on each
    bySpeciality.forEach(speciality => {
        if (speciality.measureIds.length < MAX_SPECIALITY_SET_SIZE) {
            speciality.measureIds.forEach(measureId => {
                let measure = measures.find(m => m.measureId === measureId);
                let cluster = clusterMap.get(measureId) || {
                        measureId: measureId,
                        submissionMethod: submissionMethod,
                        firstPerformanceYear: measure.firstPerformanceYear,
                        lastPerformanceYear: measure.lastPerformanceYear
                    };
                cluster['specialitySets'] =  cluster['specialitySets'] || [];
                cluster.specialitySets.push(speciality);
                clusterMap.set(measureId, cluster);
            });
        }
    });

}

function enrich(measures) {

    let claimsClusterMap = new Map();
    let registryClusterMap = new Map();

    // set the claims and registry speciality set
    populateSpecialitySet(claimsClusterMap, measures, 'claims');
    populateSpecialitySet(registryClusterMap, measures, 'registry');

    populateClinicalClusters(claimsClusterMap, measures, 'claims', claimsClusterFilePath);
    populateClinicalClusters(registryClusterMap, measures, 'registry', registryClusterFilePath);

    curate(registryClusterMap, specialClusterRelations.registry);
    curate(claimsClusterMap, specialClusterRelations.claims);

    let emaClusters = [];

    claimsClusterMap
        .forEach(v => emaClusters.push(v));

    registryClusterMap
        .forEach(v => emaClusters.push(v));


    //print the JSON back to the stream
    process.stdout.write(JSON.stringify(emaClusters, null, 2));
}

process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
    var chunk = process.stdin.read();
    if (chunk !== null) {
        json += chunk;
    }
});

process.stdin.on('end', () => {
    enrich(JSON.parse(json, 'utf8'));
});