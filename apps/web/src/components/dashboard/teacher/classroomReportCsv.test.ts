import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob, toCsv } from './classroomReportCsv';
import type { CsvColumn } from './classroomReportCsv';

interface Row {
  name: string;
  score: number | null;
}

const COLUMNS: CsvColumn<Row>[] = [
  { header: 'Explorador', value: (row) => row.name },
  { header: 'Marca', value: (row) => row.score },
];

const bodyOf = (csv: string): string[] => csv.slice(1).split('\r\n');

describe('toCsv', () => {
  it('abre con BOM, separa con punto y coma y cierra las líneas con CRLF', () => {
    const csv = toCsv([{ name: 'Axoluk', score: 100 }], COLUMNS);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(bodyOf(csv)).toEqual(['Explorador;Marca', 'Axoluk;100', '']);
  });

  it('neutraliza un nombre con forma de fórmula', () => {
    const csv = toCsv([{ name: '=HYPERLINK("http://ejemplo.com")', score: 1 }], COLUMNS);

    expect(bodyOf(csv)[1]).toBe(`"'=HYPERLINK(""http://ejemplo.com"")";1`);
  });

  it.each(['+1', '-1', '@SUMA(A1)', '\tx', '\rx'])('neutraliza el texto %j', (name) => {
    const line = bodyOf(toCsv([{ name, score: null }], COLUMNS))[1];

    expect(line).toMatch(/^"?'/);
  });

  it('mantiene en una celda un nombre con tilde, comillas y punto y coma', () => {
    const csv = toCsv([{ name: 'José "Pepe"; Núñez', score: 3 }], COLUMNS);

    expect(bodyOf(csv)[1]).toBe('"José ""Pepe""; Núñez";3');
  });

  it('escribe lo que no existe como celda vacía, no como cero', () => {
    const csv = toCsv([{ name: 'Invitada', score: null }], COLUMNS);

    expect(bodyOf(csv)[1]).toBe('Invitada;');
  });
});

describe('downloadBlob', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('descarga con el nombre pedido y libera la URL', () => {
    const createObjectURL = vi.fn(() => 'blob:reporte');
    const revokeObjectURL = vi.fn();

    Object.assign(URL, { createObjectURL, revokeObjectURL });

    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      expect(this.download).toBe('codeplay-CP-PJE6-resumen-2026-09-24.csv');
      expect(this.href).toBe('blob:reporte');
    });

    downloadBlob(new Blob(['x']), 'codeplay-CP-PJE6-resumen-2026-09-24.csv');

    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:reporte');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
