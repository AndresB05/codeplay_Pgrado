import type * as Blockly from 'blockly/core';
import { describe, expect, it } from 'vitest';
import { TopAnchoredMetrics } from './topAnchoredMetrics';

type Region = Blockly.MetricsManager.ContainerRegion;

/* El cálculo del área es puro: no toca el espacio de trabajo, así que vale uno vacío. */
class Probe extends TopAnchoredMetrics {
  area(view: Region, content: Region) {
    return this.getPaddedContent_(view, content);
  }
}

const probe = new Probe({} as Blockly.WorkspaceSvg);

const region = (top: number, height: number): Region => ({ top, height, left: 0, width: 300 });

/*
 * Blockly encierra la vista en el área: la deja entre su tope y su fondo menos
 * un alto de vista. Si la vista que había ya no cabe, la mueve.
 */
const keepsView = (view: Region, content: Region) => {
  const area = probe.area(view, content);

  return view.top >= area.top && view.top <= Math.max(area.top, area.bottom - view.height);
};

describe('TopAnchoredMetrics', () => {
  it('no deja sitio por encima de los bloques con la vista arriba', () => {
    expect(probe.area(region(0, 300), region(0, 60)).top).toBe(0);
  });

  it('un bloque soltado asomando por arriba no mueve la vista', () => {
    expect(keepsView(region(0, 300), region(-5, 120))).toBe(true);
  });

  it('con la vista desplazada hacia abajo, soltar arriba tampoco la mueve', () => {
    expect(keepsView(region(400, 300), region(-20, 900))).toBe(true);
  });
});
