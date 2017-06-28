/**
 * Will update the measures with ema speciality requirements.
 * After this enricher, the measures that has less than 6 quality measures for claims and
 * registry will have the following structure added to it:
 * {
 *   "ema": {
 *      "claimsSpecialitySet": [ {"name":"specialityName","measureIds":["m1","m2","mN"]}],
 *      "registrySpecialitySet": [{"name":"specialityName","measureIds":["m1","m2","mN"]}]
 *    }
 * }
 *
 * Example of an "EMA" section for measure 110:
 * "ema": {
 *    "claimsSpecialitySet":[
 *      {"name":"pediatrics","measureIds":["093","091","110","134"]},
 *      {"name":"allergyImmunology","measureIds":["130","111","110","317","226"]}
 *    ]
 * }
 * @param measures
 */

var _ = require('lodash');

var json = '';

function enrich(measures) {

    // group the claim measures by speciality set
    var claimsBySpeciality = _.chain(measures)
        .filter(m => m.category === 'quality')
        .filter(m => m.submissionMethods && m.submissionMethods.indexOf('claims') > -1)
        .flatMap(m => m.measureSets.map(speciality => Object.assign({speciality: speciality}, m)))
        .groupBy('speciality')
        .map((val, key) => ({name: key, measureIds: val.map(m => m.measureId)}))
        .value();

    // group the registry measures by speciality set
    var registryBySpeciality = _.chain(measures)
        .filter(m => m.category === 'quality')
        .filter(m => m.submissionMethods && m.submissionMethods.indexOf('registry') > -1)
        .flatMap(m => m.measureSets.map(speciality => Object.assign({speciality: speciality}, m)))
        .groupBy('speciality')
        .map((val, key) => ({name: key, measureIds: val.map(m => m.measureId)}))
        .value();

    // modify the incoming measures and add ema section to it with 'claimsSpecialitySet'
    claimsBySpeciality.forEach(speciality => {
        if (speciality.measureIds.length < 6) {
            speciality.measureIds.forEach(measureId => {
                var measure = measures.find(m => m.measureId === measureId);
                measure['ema'] = measure['ema'] || {};
                measure['ema']['claimsSpecialitySet'] = measure['ema']['claimsSpecialitySet'] || [];
                measure['ema']['claimsSpecialitySet'].push(speciality);
            });
        }
    });


    // modify the incoming measures and add ema section to it with 'registrySpecialitySet'
    registryBySpeciality.forEach(speciality => {
        if (speciality.measureIds.length < 6) {
            speciality.measureIds.forEach(measureId => {
                var measure = measures.find(m => m.measureId === measureId);
                measure['ema'] = measure['ema'] || {};
                measure['ema']['registrySpecialitySet'] = measure['ema']['registrySpecialitySet'] || [];
                measure['ema']['registrySpecialitySet'].push(speciality);
            });
        }
    });
}


process.stdin.on('readable', () => {
    var chunk = this.read();
    if (chunk !== null) {
        json += chunk;
    }
});

process.stdin.on('end', () => {
    enrich(json);
});