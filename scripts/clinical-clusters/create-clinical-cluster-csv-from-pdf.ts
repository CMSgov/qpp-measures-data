/*
    Reads the CMS EMA / Denominator Reduction user guide as PDF (text extraction).
    Appendix A clinical topics → ClaimsClinical_Cluster.csv and RegistryClinicalCluster.csv
    (measure order preserved). Appendix B is not written to those CSVs.
    Place: scripts/clinical-clusters/{year}-EMA-and-Denominator-Reduction-User-Guide.pdf
    Run: `npm run create:clinical-clusters` (prompts for year)
    Or:  `npm run create:clinical-clusters -- 2026`
*/

import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import { json2csv } from 'json-2-csv';
import pdfParse from 'pdf-parse';
import { getPerformanceYear } from './prompt-performance-year';

/** Clinical topic → measure IDs in PDF document order. */
type TopicMeasureGroups = Array<{ topic: string; measureIds: string[] }>;

const clinicalTopicReplace: Record<string, string> = {
  'Pathology 1': 'Pathology',
  AnesthesiologyCare: 'Anesthesiology Care',
  'Pathology –Skin Cancer': 'Pathology Skin Cancer',
  'Pathology – Skin Cancer': 'Pathology Skin Cancer',
  CardiacStressImaging: 'Cardiac Stress Imaging',
};

const APPENDIX_B_SPLIT =
  /Appendix B:\s*Specialty\s+Measure Sets with\s+Fewer than 6 Measures\s*/i;

const MEASURE_START_REGEX = /^([\d]{3}):\s*(.*)$/;

function guidePdfPath(year: string): string {
  return path.join(
    __dirname,
    `${year}-EMA-and-Denominator-Reduction-User-Guide.pdf`
  );
}

async function loadPdfText(year: string): Promise<string> {
  const pdfPath = guidePdfPath(year);
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF not found: ${pdfPath}`);
  }
  const buf = fs.readFileSync(pdfPath);
  const result = await pdfParse(buf);
  return result.text;
}

function splitClinicalAndSpecialtyFromGuide(raw: string): {
  clinicalLines: string[];
  specialtyLines: string[];
  mode: 'partition' | 'legacy';
} {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '');
  const repaired = expandTopicWithTrailingMeasure(repairPdfMeasureTokens(lines));
  const partitioned = partitionByEmaTableHeaders(repaired);
  if (
    partitioned.clinicalLines.length > 0 &&
    partitioned.specialtyLines.length > 0
  ) {
    return { ...partitioned, mode: 'partition' };
  }
  return { ...splitClinicalAndSpecialtyLegacy(raw), mode: 'legacy' };
}

function splitClinicalAndSpecialtyLegacy(raw: string): {
  clinicalLines: string[];
  specialtyLines: string[];
} {
  const parts = raw.split(APPENDIX_B_SPLIT);
  const clinicalLines = (parts[0] || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');
  const specialtyText = parts.slice(1).join('\n');
  const specialtyLines = specialtyText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');
  return { clinicalLines, specialtyLines };
}

function repairPdfMeasureTokens(lines: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (
      i + 1 < lines.length &&
      /[A-Za-z]\d{3}$/.test(line.trim()) &&
      /^\s*:/.test(lines[i + 1])
    ) {
      line = `${line.trim()}${lines[i + 1].trim()}`;
      i++;
    }
    line = insertSpaceBeforeEmbeddedMeasureId(line);
    if (/^\d{3}\s*$/.test(line) && i + 1 < lines.length) {
      const next = lines[i + 1];
      if (/^:\s*/.test(next)) {
        out.push(line + insertSpaceBeforeEmbeddedMeasureId(next).trim());
        i++;
        continue;
      }
    }
    out.push(line);
  }
  return out;
}

function insertSpaceBeforeEmbeddedMeasureId(line: string): string {
  return line.replace(/\b([A-Za-z]+)(\d{3})\s*:/g, '$1 $2:');
}

function expandTopicWithTrailingMeasure(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const m = line.match(/^(.+?)\s+(\d{3}:\s*.+)$/);
    if (m) {
      const prefix = m[1].trim();
      const measurePart = m[2].trim();
      if (!MEASURE_START_REGEX.test(prefix) && MEASURE_START_REGEX.test(measurePart)) {
        out.push(prefix);
        out.push(measurePart);
        continue;
      }
    }
    out.push(line);
  }
  return out;
}

function partitionByEmaTableHeaders(lines: string[]): {
  clinicalLines: string[];
  specialtyLines: string[];
} {
  const clinicalLines: string[] = [];
  const specialtyLines: string[] = [];
  let mode: 'none' | 'clinical' | 'specialty' = 'none';

  for (const line of lines) {
    const t = line.toLowerCase();
    const isClinicalHeader =
      t.includes('clinical topic') &&
      t.includes('medicare part b claims') &&
      !t.includes('specialty measure set');
    const isSpecialtyHeader =
      t.includes('specialty measure set') && t.includes('medicare part b claims');

    if (isClinicalHeader) {
      mode = 'clinical';
      clinicalLines.push(line);
      continue;
    }
    if (isSpecialtyHeader) {
      mode = 'specialty';
      specialtyLines.push(line);
      continue;
    }
    if (mode === 'clinical') {
      clinicalLines.push(line);
    } else if (mode === 'specialty') {
      specialtyLines.push(line);
    }
  }
  return { clinicalLines, specialtyLines };
}

function clinicalTopicTableHeader(line: string): boolean {
  const t = line.toLowerCase();
  return (
    t.includes('clinical topic') &&
    t.includes('medicare part b claims') &&
    !t.includes('specialty measure set')
  );
}

function specialtyTopicTableHeader(line: string): boolean {
  const t = line.toLowerCase();
  return t.includes('specialty measure set') && t.includes('medicare part b claims');
}

/**
 * True when a line is a new Appendix A clinical topic row (not a measure title wrapped to the next line).
 * e.g. "Surgical Care" is a topic; "Surgical Site Infection (SSI)" is measure 357's title, not a topic.
 */
function isClinicalTopicHeaderLine(line: string): boolean {
  const t = line.trim();
  if (!t || /\d{3}\s*:/.test(t)) {
    return false;
  }
  if (/^Pathology(\s+\d+|\s+Skin\s+Cancer)?$/i.test(t)) {
    return true;
  }
  if (/\(C\)\s*$|\(N\)\s*$/i.test(t) && t.length < 50) {
    return true;
  }
  // Wrapped measure names — not cluster headings
  if (
    /\b(Infection|Assessment|Communication|Screening|Reporting|Treatment|Testing|Documentation|Prevention|Reoperation|Biopsy|Colonoscopy|Pharyngitis|Respiratory|Radiology:|Fluoroscopy|Nodules|Lesions)\b/i.test(
      t
    )
  ) {
    return false;
  }
  if (
    t.length <= 45 &&
    /\b(Care|Imaging|Surveillance|Radiology|Tomography|Inpatient|Oncology)\s*$/i.test(t)
  ) {
    return true;
  }
  // First line of a multi-line topic (e.g. "Computed", "Infectious", "Interventional")
  if (
    t.length <= 22 &&
    /^(Computed|Diagnostic|Endoscopy|Interventional|Anesthesiology|CABG|Cardiac|Cataract|Infectious|Pathology|Allergy|Hospital|Gynecology|Pulmonary|Neurology|Surgical|Urgent|Obstetrics)$/i.test(
      t
    )
  ) {
    return true;
  }
  return false;
}

function isPrimaryMeasureLine(line: string): boolean {
  const t = line.trim();
  if (/^\d{3}\s*:/.test(t)) {
    return true;
  }
  return /^[^\d:]{0,45}\d{3}\s*:/.test(t);
}

function extractMeasureIdsFromLine(line: string): string[] {
  const s = line.trim();
  const out: string[] = [];
  const re = /(?:^|\s)(\d{3})\s*:\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function applyTopicReplace(topic: string): string {
  const t = topic.replace(/\s*\((C|N)\)$/, '').replace(/\s+/g, ' ').trim();
  return clinicalTopicReplace[t] ?? t;
}

function blocksFromEmaTableLines(
  lines: string[]
): Array<{ topic: string; measureIds: string[] }> {
  const blocks: Array<{ topic: string; measureIds: string[] }> = [];
  let topicLines: string[] = [];
  let topicFixed = '';
  const idsForBlock: string[] = [];

  const emitBlock = () => {
    if (idsForBlock.length === 0) {
      return;
    }
    const rawTopic = (topicFixed || topicLines.join(' '))
      .replace(/\s+/g, ' ')
      .trim();
    if (!rawTopic) {
      idsForBlock.length = 0;
      topicFixed = '';
      topicLines = [];
      return;
    }
    const topic = applyTopicReplace(rawTopic);
    blocks.push({ topic, measureIds: [...new Set(idsForBlock)] });
    idsForBlock.length = 0;
    topicFixed = '';
    topicLines = [];
  };

  for (const raw of lines) {
    const L = raw.trim();
    if (!L) {
      continue;
    }
    if (clinicalTopicTableHeader(L) || specialtyTopicTableHeader(L)) {
      emitBlock();
      topicLines = [];
      topicFixed = '';
      continue;
    }
    if (/^\d{1,3}$/.test(L)) {
      continue;
    }

    const idsHere = isPrimaryMeasureLine(L) ? extractMeasureIdsFromLine(L) : [];

    if (idsHere.length > 0) {
      if (!topicFixed) {
        topicFixed = topicLines.join(' ').replace(/\s+/g, ' ').trim();
        topicLines = [];
        if (!topicFixed) {
          const prefixMatch = L.match(/^(.+?)\s+(\d{3})\s*:/);
          if (prefixMatch) {
            topicFixed = prefixMatch[1].trim();
          }
        }
      }
      idsForBlock.push(...idsHere);
      continue;
    }

    if (L.toLowerCase() === 'not applicable') {
      emitBlock();
      topicFixed = '';
      topicLines = [];
      continue;
    }

    if (idsForBlock.length > 0) {
      if (isClinicalTopicHeaderLine(L)) {
        emitBlock();
        topicFixed = '';
        topicLines = [L];
        continue;
      }
      // Measure title continuation on the next line after "357:" etc.
      continue;
    }

    if (!topicFixed) {
      topicLines.push(L);
    }
  }
  emitBlock();
  return blocks;
}

function mergeTopicMeasureGroups(
  blocks: Array<{ topic: string; measureIds: string[] }>
): TopicMeasureGroups {
  const byTopic = new Map<string, string[]>();
  const topicOrder: string[] = [];

  for (const b of blocks) {
    if (!byTopic.has(b.topic)) {
      byTopic.set(b.topic, []);
      topicOrder.push(b.topic);
    }
    const ids = byTopic.get(b.topic)!;
    for (const id of b.measureIds) {
      if (!ids.includes(id)) {
        ids.push(id);
      }
    }
  }

  return topicOrder.map((topic) => ({
    topic,
    measureIds: byTopic.get(topic)!,
  }));
}

const MEASURE_REGEX = /(\d{3}):\s*/g;

function extractMeasures(inlineData: string[]): TopicMeasureGroups {
  let clinicalTopic = '';
  const byTopic = new Map<string, string[]>();
  const topicOrder: string[] = [];

  const ensureTopic = (topic: string) => {
    if (!byTopic.has(topic)) {
      byTopic.set(topic, []);
      topicOrder.push(topic);
    }
    return byTopic.get(topic)!;
  };

  inlineData.forEach((data, index) => {
    if (checkMeasure(data)) {
      if (!checkMeasure(inlineData[index - 1])) {
        clinicalTopic = getClinicalTopic(inlineData, index);
        clinicalTopic = clinicalTopic.replace(/\s*\((C|N)\)$/, '');
        ensureTopic(clinicalTopic);
      }
      if (MEASURE_START_REGEX.test(data)) {
        MEASURE_REGEX.lastIndex = 0;
        const matches = data.match(MEASURE_REGEX);
        const ids = ensureTopic(clinicalTopic);
        if (Array.isArray(matches) && matches.length > 1) {
          const subMeasures = extractInlineMeasures(data, matches);
          subMeasures.forEach((measure) => {
            const id = measure.split(':')[0];
            if (!ids.includes(id)) {
              ids.push(id);
            }
          });
        } else if (Array.isArray(matches) && matches.length === 1) {
          const id = data.split(':')[0];
          if (!ids.includes(id)) {
            ids.push(id);
          }
        }
      }
    }
  });

  return topicOrder.map((topic) => ({
    topic,
    measureIds: byTopic.get(topic)!,
  }));
}

function checkMeasure(value: string) {
  return (
    MEASURE_START_REGEX.test(value) ||
    value.trim().toLowerCase() === 'not applicable'
  );
}

function isMedicareClaimsBoundaryLine(line: string): boolean {
  const t = line.trim().toLowerCase();
  if (t === 'medicare part b claims') {
    return true;
  }
  if (t.includes('clinical topic') && t.includes('medicare part b claims')) {
    return true;
  }
  if (t.includes('specialty measure set') && t.includes('medicare part b claims')) {
    return true;
  }
  return false;
}

function getClinicalTopic(data: string[], index: number) {
  let currentIndex = index - 1;
  const clinicalTopic: string[] = [];
  while (
    currentIndex >= 0 &&
    !isMedicareClaimsBoundaryLine(data[currentIndex]) &&
    !checkMeasure(data[currentIndex])
  ) {
    clinicalTopic.push(data[currentIndex].trim());
    currentIndex--;
  }
  const fullClinicalTopic = clinicalTopic
    .reverse()
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clinicalTopicReplace[fullClinicalTopic]
    ? clinicalTopicReplace[fullClinicalTopic]
    : fullClinicalTopic;
}

function extractInlineMeasures(lineData: string, matches: string[]) {
  const subMeasures: string[] = [];
  matches.reverse().forEach((match, index) => {
    const measurePos = lineData.indexOf(match);
    subMeasures.push(lineData.substring(measurePos));
    if (index !== matches.length) {
      lineData = lineData.substring(0, measurePos);
    }
  });
  return subMeasures.reverse();
}

function writeClinicalClusterCsvs(
  year: string,
  clinicalMeasures: TopicMeasureGroups,
  specialtyMeasures: TopicMeasureGroups
): void {
  const measuresPath = `measures/${year}/measures-data.json`;
  const measuresJson: object[] = JSON.parse(
    fs.readFileSync(path.join(appRoot.path, measuresPath), 'utf8')
  );

  const clinicalMeasuresList = clinicalMeasures.flatMap((g) => g.measureIds);
  const specialtyMeasuresList = specialtyMeasures.flatMap((g) => g.measureIds);

  const filteredMeasures: object[] = measuresJson.filter((measure) =>
    [...clinicalMeasuresList, ...specialtyMeasuresList].includes(
      measure['measureId'] as string
    )
  );

  const clinicalClaimsData: object[] = [];
  const clinicalRegistryData: object[] = [];
  clinicalMeasures.forEach(({ topic: clinicalTopic, measureIds }) => {
    measureIds.forEach((measureId) => {
      const measure =
        filteredMeasures.find((m) => m['measureId'] === measureId) || {};
      const methods = (measure['submissionMethods'] as string[]) || [];
      if (methods.includes('claims')) {
        clinicalClaimsData.push({
          Title: clinicalTopic,
          'Quality ID': measureId,
        });
      }
      if (methods.includes('registry')) {
        clinicalRegistryData.push({
          Title: clinicalTopic,
          'Quality ID': measureId,
        });
      }
    });
  });

  const csvDir = path.join(
    __dirname,
    '../../util/clinical-clusters',
    year
  );
  fs.mkdirSync(csvDir, { recursive: true });
  fs.writeFileSync(
    path.join(csvDir, 'ClaimsClinical_Cluster.csv'),
    json2csv(clinicalClaimsData)
  );
  fs.writeFileSync(
    path.join(csvDir, 'RegistryClinicalCluster.csv'),
    json2csv(clinicalRegistryData)
  );
}

async function main(year: string): Promise<void> {
  const data = await loadPdfText(year);
  const { clinicalLines, specialtyLines, mode } =
    splitClinicalAndSpecialtyFromGuide(data);

  const clinicalMeasures =
    mode === 'partition'
      ? mergeTopicMeasureGroups(blocksFromEmaTableLines(clinicalLines))
      : extractMeasures(clinicalLines);
  const specialtyMeasures =
    mode === 'partition'
      ? mergeTopicMeasureGroups(blocksFromEmaTableLines(specialtyLines))
      : extractMeasures(specialtyLines);

  writeClinicalClusterCsvs(year, clinicalMeasures, specialtyMeasures);

  console.log(
    `Clinical Cluster CSV files created for ${year} in util/clinical-clusters/${year}/`
  );
  console.log(
    'Next: npm run build:clinical-clusters (or npm run clinical-clusters to do both in one step)'
  );
}

getPerformanceYear()
  .then((year) => main(year))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
