import type { ClassroomReport } from './classroomReport';
import { buildReportFileName, formatReportDate, formatReportDateTime } from './classroomReport';
import { downloadBlob } from './classroomReportCsv';

const DETAIL_COLUMNS = ['Mundo', 'Nivel', 'Estado', 'Marca', 'Intentos', 'Menos pasos', 'Óptimo'];

const show = (value: number | null): string => (value === null ? '—' : String(value));

/**
 * Genera y descarga el PDF del salón. Las dos librerías se importan aquí dentro
 * para que Vite las saque a un trozo aparte: sólo las descarga quien pide un PDF.
 */
export const downloadClassroomReportPdf = async (report: ClassroomReport): Promise<void> => {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const margin = 14;

  doc.setFontSize(16);
  doc.text(`Reporte de ${report.groupName} (${report.publicId})`, margin, 16);
  doc.setFontSize(10);
  doc.text(`Generado el ${formatReportDate(report.generatedAt)} en CodePlay`, margin, 23);

  autoTable(doc, {
    startY: 30,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [60, 60, 60] },
    head: [
      [
        'Explorador',
        'XP',
        'Racha',
        'Niveles',
        'Mundos',
        'Marca media',
        'Intentos',
        'Última actividad',
      ],
    ],
    body: report.summary.map((row) => [
      row.studentName,
      String(row.xp),
      show(row.streakDays),
      `${row.completedLevels} de ${row.catalogLevels}`,
      `${row.completedWorlds} de ${row.catalogWorlds}`,
      show(row.averageBestScore),
      String(row.totalAttempts),
      row.lastActivityIso ? formatReportDateTime(row.lastActivityIso) : 'Sin actividad',
    ]),
  });

  /*
   * Una sola tabla con una fila de título por explorador, y no una tabla por
   * explorador: así la librería parte las páginas y repite la cabecera sola.
   */
  const detailBody = report.summary.flatMap((summaryRow) => [
    [
      {
        content: summaryRow.studentName,
        colSpan: DETAIL_COLUMNS.length,
        styles: { fontStyle: 'bold' as const, fillColor: [230, 230, 230] as [number, number, number] },
      },
    ],
    ...report.detail
      .filter((row) => row.studentId === summaryRow.studentId)
      .map((row) => [
        row.worldTitle,
        row.levelTitle,
        row.status,
        show(row.bestScore),
        show(row.attemptCount),
        show(row.fewestSteps),
        show(row.optimalSteps),
      ]),
  ]);

  doc.addPage();
  doc.setFontSize(14);
  doc.text('Detalle por nivel', margin, 16);

  autoTable(doc, {
    startY: 22,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [60, 60, 60] },
    head: [DETAIL_COLUMNS],
    body: detailBody,
  });

  downloadBlob(
    doc.output('blob'),
    buildReportFileName(report.publicId, 'reporte', report.generatedAt)
  );
};
