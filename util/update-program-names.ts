import * as fse from 'fs-extra';
import * as path from 'path';

/**
 *
 * @return {void}
 * Adds any new program name fields from the mvp.json file for the given performance year
 */
export function updateProgramNames(performanceYear: number): void {
  let programNames: any;
  const programNamesFilePath = path.join(__dirname, '../util/program-names', 'program-names.json');
  const mvpFilePath = path.join(__dirname, '../mvp', performanceYear.toString(), 'mvp.json');

  console.log('programNamesFilePath', programNamesFilePath);
  console.log('mvpFilePath', mvpFilePath);

  let mvpData: any[] = [];

  try {
    programNames = JSON.parse(fse.readFileSync(programNamesFilePath, 'utf8'));
    mvpData = JSON.parse(fse.readFileSync(mvpFilePath, 'utf8'));

    mvpData.forEach(mvp => {
      if (!programNames[mvp.mvpId]) {
        programNames[mvp.mvpId] = mvp.mvpId;
      }
    });

    fse.writeFileSync(programNamesFilePath, JSON.stringify(programNames, null, 2));
  } catch (e) {
    console.log('Error parsing the program-names.json or mvp.json file: ' + ' --> ' + e);
  }
}