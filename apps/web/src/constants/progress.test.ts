import { describe, expect, it } from 'vitest';
import { XP_PER_EXPLORER_LEVEL, explorerLevel, xpIntoExplorerLevel } from './progress';

describe('explorerLevel', () => {
  it('una cuenta sin actividad ya está en el primero', () => {
    expect(explorerLevel(0)).toBe(1);
    expect(xpIntoExplorerLevel(0)).toBe(0);
  });

  /* El borde que decide: 299 sigue dentro, 300 ya no. */
  it('sube justo al llenar el tramo, no antes', () => {
    expect(explorerLevel(XP_PER_EXPLORER_LEVEL - 1)).toBe(1);
    expect(xpIntoExplorerLevel(XP_PER_EXPLORER_LEVEL - 1)).toBe(299);
    expect(explorerLevel(XP_PER_EXPLORER_LEVEL)).toBe(2);
    expect(xpIntoExplorerLevel(XP_PER_EXPLORER_LEVEL)).toBe(0);
  });

  it('los nueve niveles perfectos dejan al niño estrenando el cuarto', () => {
    expect(explorerLevel(900)).toBe(4);
    expect(xpIntoExplorerLevel(900)).toBe(0);
  });

  /*
   * El caso real de la cuenta de pruebas el 17-sep-2026, para que el número de
   * la pantalla tenga de dónde salir.
   */
  it('693 XP son el tercero, con 93 dentro', () => {
    expect(explorerLevel(693)).toBe(3);
    expect(xpIntoExplorerLevel(693)).toBe(93);
  });

  /*
   * No hay techo a propósito: el día que los logros repartan XP, la barra tiene
   * que seguir funcionando sin tocarla.
   */
  it('no se queda sin tramos', () => {
    expect(explorerLevel(5_000)).toBe(17);
  });

  it('un XP que no es un número no rompe la cuenta', () => {
    expect(explorerLevel(Number.NaN)).toBe(1);
    expect(explorerLevel(-50)).toBe(1);
    expect(xpIntoExplorerLevel(-50)).toBe(0);
  });
});
