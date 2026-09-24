import { useEffect, useRef, useState } from 'react';
import { studentProgressService } from '../../../services/studentProgress.service';
import type { ClassGroup } from '../../../types/classroom.types';
import { buildClassroomReport } from './classroomReport';
import type { ClassroomReport } from './classroomReport';
import { downloadDetailCsv, downloadSummaryCsv } from './classroomReportCsv';
import { downloadClassroomReportPdf } from './classroomReportPdf';
import { DownloadIcon } from './TeacherIcons';

interface ExportReportMenuProps {
  group: ClassGroup;
}

interface ExportOption {
  label: string;
  run: (report: ClassroomReport) => void | Promise<void>;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { label: 'Resumen (CSV)', run: downloadSummaryCsv },
  { label: 'Detalle por nivel (CSV)', run: downloadDetailCsv },
  { label: 'Reporte completo (PDF)', run: downloadClassroomReportPdf },
];

const EXPORT_ERROR = 'No se pudo generar el reporte. Inténtalo de nuevo en un momento.';

export const ExportReportMenu = ({ group }: ExportReportMenuProps) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isEmpty = group.students.length === 0;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  /*
   * Lectura fresca en cada exportación, catálogo incluido: el reporte tiene que
   * cuadrar con lo que la ficha del panel enseñaría ahora, no con lo que había
   * al abrir la pantalla.
   */
  const handleExport = async (option: ExportOption) => {
    setOpen(false);
    setBusy(true);
    setError(null);

    try {
      const [catalog, details] = await Promise.all([
        studentProgressService.getCatalog(),
        studentProgressService.getClassroomDetail(group.id),
      ]);

      if (!catalog.data || !details.data) {
        setError(EXPORT_ERROR);

        return;
      }

      await option.run(buildClassroomReport(group, catalog.data, details.data, new Date()));
    } catch {
      /* La librería del PDF se descarga al pulsar: sin red, falla aquí. */
      setError(EXPORT_ERROR);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={isEmpty || busy}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn btn-sky disabled:cursor-not-allowed disabled:opacity-60"
      >
        <DownloadIcon />
        {busy ? 'Generando…' : 'Exportar reporte'}
      </button>

      {isEmpty ? (
        <p className="mt-1.5 text-[13px] font-bold text-white/90">
          No hay exploradores que reportar.
        </p>
      ) : null}

      {open ? (
        <ul
          role="menu"
          aria-label="Formato del reporte"
          className="card absolute right-0 z-20 mt-2 w-60 overflow-hidden p-1.5"
        >
          {EXPORT_OPTIONS.map((option) => (
            <li key={option.label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleExport(option)}
                className="w-full rounded-xl px-3 py-2 text-left font-display text-[15px] text-ink hover:bg-grape-soft"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="chip chip-coral absolute right-0 z-20 mt-2 block w-64 rounded-[18px] px-4 py-2.5 text-[14px] leading-snug"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
};
