const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Extract archive file safely.
const extractZip = function (zipPath, extractDir, maxFiles = 100, maxSize = 50000000) {
  const MAX_FILES = maxFiles;
  const MAX_SIZE = maxSize; // 50MB
  const THRESHOLD_RATIO = 10;

  let fileCount = 0;
  let totalSize = 0;
  let zip = new AdmZip(zipPath);
  let zipEntries = zip.getEntries();
  zipEntries.forEach(function(zipEntry) {
      fileCount++;
      if (fileCount > MAX_FILES) throw new Error('Reached max. number of files');

      let entrySize = zipEntry.getData().length;
      totalSize += entrySize;
      if (totalSize > MAX_SIZE) throw new Error('Reached max. size');

      let compressionRatio = entrySize / zipEntry.header.compressedSize;
      if (compressionRatio > THRESHOLD_RATIO) throw new Error('Reached max. compression ratio');

      if (!zipEntry.isDirectory) {
          zip.extractEntryTo(zipEntry.entryName, extractDir);
      }
  });
}

const getXMLFiles = function(tmpDir, tmpPath) {
  return fs.readdirSync(tmpDir).map(measureZip => {
    // 2024 xml fiels list does not have -v2 in the filename. Check for -v2 may need to be removed in future.
    const folder = (measureZip.toString().split('.')[0].replace('-v2', ''));
    const zip = new AdmZip(path.join(tmpDir, measureZip));
    const { entryName: filename } = zip.getEntries()
      .find(({ entryName }) => {
        const filename = entryName.toString();
        return filename.includes('.xml') && filename.includes(folder);
      });

    // extract 'CMS75v5.xml' to /xmls
    zip.extractEntryTo(filename, tmpPath, false, true);
    return filename;
  });
}

/*
return strata name, description, and uuids like so
[
  {
    name: 'strata1',
    description: 'Patients who initiated treatment within 14 days of the diagnosis',
    eMeasureUuids: {
      initialPopulationUuid: '25286925-4221-4396-9DE0-60EA606924DF',
      denominatorUuid: 'CFB8E3E2-FF4F-4D25-B613-7EC142BAE8A9',
      numeratorUuid: 'A399FA9C-48CF-41E5-812A-3445188B8301',
      denominatorExclusionUuid: 'EEAD441F-B3B2-4DC9-A890-B35E14B38EA7',
      denominatorExceptionUuid: 'E76F6606-1DC9-40DE-8A34-5B4B4E859152'
    }
  }
  ...
*/
function extractStrata(measure, strataDescriptions) {
  const strata = strataDescriptions.map(description => ({ description }));
  // pull out uuids for each stratum
  const components = measure.component.slice(1);
  components.forEach((component, index) => {
    const ids = component.populationCriteriaSection[0].component;
    const eMeasureUuids = {
      initialPopulationUuid: ids.find(item => item.initialPopulationCriteria).initialPopulationCriteria[0].id[0].$.root,
      denominatorUuid: ids.find(item => item.denominatorCriteria).denominatorCriteria[0].id[0].$.root,
      numeratorUuid: ids.find(item => item.numeratorCriteria).numeratorCriteria[0].id[0].$.root
    };

    const denominatorException = ids.find(item => item.denominatorExceptionCriteria);
    if (denominatorException) {
      eMeasureUuids.denominatorExceptionUuid = denominatorException.denominatorExceptionCriteria[0].id[0].$.root;
    }

    const denominatorExclusion = ids.find(item => item.denominatorExclusionCriteria);
    if (denominatorExclusion) {
      eMeasureUuids.denominatorExclusionUuid = denominatorExclusion.denominatorExclusionCriteria[0].id[0].$.root;
    }

    const numeratorExclusion = ids.find(item => item.numeratorExclusionCriteria);
    if (numeratorExclusion) {
      eMeasureUuids.numeratorExclusionUuid = numeratorExclusion.numeratorExclusionCriteria[0].id[0].$.root;
    }

    strata[index].eMeasureUuids = eMeasureUuids;
  });

  return strata;
}

function extractAdditionalStrata(measure) {
  const strataMaps = [];
  const supplementDataType = 'SDE';
  measure.component.forEach((component, index) => {
    if (!component.populationCriteriaSection) return;
    const components = component.populationCriteriaSection[0].component;
    const numeratorUuid = components.find(item => item.numeratorCriteria).numeratorCriteria[0].id[0].$.root;
    const stratList = [];
    // Loops through a Stratifier Criteria's components. If it's not a supplemental data component, add the stratum.
    components.filter(item => item.stratifierCriteria).forEach((component, index) => {
      const supplementalDataComponent = component.stratifierCriteria[0].component;
      if (_.isUndefined(supplementalDataComponent) ||
        supplementalDataComponent[0].measureAttribute[0].code[0].$.code !== supplementDataType) {
        stratList.push(component.stratifierCriteria[0].id[0].$.root);
      }
    });
    if (stratList.length !== 0) {
      const numeratorMap = {};
      numeratorMap['numeratorUuid'] = numeratorUuid;
      numeratorMap['strata'] = stratList;
      strataMaps.push(numeratorMap);
    }
  });

  return strataMaps;
}

module.exports = { extractZip, getXMLFiles, extractStrata, extractAdditionalStrata };
