import type { ClassroomReport, ReportDetailRow, ReportSummaryRow } from './classroomReport';
import { buildReportFileName, formatReportDateTime } from './classroomReport';

type CsvValue = string | number | null;

export interface CsvColumn<Row> {
  header: string;
  value: (row: Row) => CsvValue;
}

/*
 * `;` y no `,`: Excel en español usa la coma como decimal y toma el punto y coma
 * como separador de lista, así que con coma abriría todo en una columna.
 */
const SEPARATOR = ';';

/*
 * El BOM hace que Excel lea el archivo como UTF-8; sin él lo abre en la página
 * de códigos local y rompe tildes y eñes.
 */
const BOM = String.fromCharCode(0xfeff);

const FORMULA_START = /^[=+\-@\t\r]/;

const NEEDS_QUOTES = /[";\r\n]/;

/*
 * Los nombres los escribe el propio niño, así que un texto que empiece como una
 * fórmula se evaluaría en la hoja de cálculo del tutor. El apóstrofo delante es
 * la mitigación de OWASP: la hoja lo lee como texto. Sólo a textos: prefijar un
 * número lo convertiría en texto.
 */
const escapeCsvValue = (value: CsvValue): string => {
  if (value === null) {
    return '';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  const safe = FORMULA_START.test(value) ? `'${value}` : value;

  return NEEDS_QUOTES.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const toCsv = <Row>(rows: Row[], columns: CsvColumn<Row>[]): string => {
  const lines = [
    columns.map((column) => escapeCsvValue(column.header)),
    ...rows.map((row) => columns.map((column) => escapeCsvValue(column.value(row)))),
  ].map((cells) => cells.join(SEPARATOR));

  return `${BOM}${lines.join('\r\n')}\r\n`;
};

/** La única forma de descargar de la aplicación; la usan también el PDF. */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const SUMMARY_COLUMNS: CsvColumn<ReportSummaryRow>[] = [
  { header: 'Explorador', value: (row) => row.studentName },
  { header: 'XP', value: (row) => row.xp },
  { header: 'Racha (días)', value: (row) => row.streakDays },
  { header: 'Niveles superados', value: (row) => row.completedLevels },
  { header: 'Niveles del catálogo', value: (row) => row.catalogLevels },
  { header: 'Mundos terminados', value: (row) => row.completedWorlds },
  { header: 'Mundos del catálogo', value: (row) => row.catalogWorlds },
  { header: 'Marca media', value: (row) => row.averageBestScore },
  { header: 'Intentos totales', value: (row) => row.totalAttempts },
  {
    header: 'Última actividad',
    value: (row) => (row.lastActivityIso ? formatReportDateTime(row.lastActivityIso) : null),
  },
];

const DETAIL_COLUMNS: CsvColumn<ReportDetailRow>[] = [
  { header: 'Explorador', value: (row) => row.studentName },
  { header: 'Mundo', value: (row) => row.worldTitle },
  { header: 'Nivel', value: (row) => row.levelTitle },
  { header: 'Estado', value: (row) => row.status },
  { header: 'Marca', value: (row) => row.bestScore },
  { header: 'Intentos', value: (row) => row.attemptCount },
  { header: 'Menos pasos', value: (row) => row.fewestSteps },
  { header: 'Pasos óptimos', value: (row) => row.optimalSteps },
];

const downloadCsv = (content: string, fileName: string): void => {
  downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8' }), fileName);
};

export const downloadSummaryCsv = (report: ClassroomReport): void => {
  downloadCsv(
    toCsv(report.summary, SUMMARY_COLUMNS),
    buildReportFileName(report.publicId, 'resumen', report.generatedAt)
  );
};

export const downloadDetailCsv = (report: ClassroomReport): void => {
  downloadCsv(
    toCsv(report.detail, DETAIL_COLUMNS),
    buildReportFileName(report.publicId, 'detalle', report.generatedAt)
  );
};
