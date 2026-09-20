import { describe, expect, it } from 'vitest';
import { bogotaDay, liveStreak, streakLabel } from './streak';
import type { StreakState } from '../types/progress.types';

const racha = (over: Partial<StreakState> = {}): StreakState => ({
  current: 3,
  max: 5,
  lastDay: '2026-09-18',
  ...over,
});

/* Mediodía del 18 en Colombia, que en UTC son las 17:00 del mismo día. */
const MEDIODIA = new Date('2026-09-18T17:00:00.000Z');

describe('bogotaDay', () => {
  /*
   * LA MEDICIÓN QUE DECIDIÓ LA ZONA HORARIA, del 18-sep-2026: las partidas
   * guardadas entre las 00:20 y la 01:43 UTC del 18 son la NOCHE DEL 17 en
   * Colombia. Contar en UTC daba racha 2 sobre ese mismo historial, y contar en
   * hora local daba otra cosa.
   */
  it('una partida de la noche cuenta como el día que el niño está viviendo', () => {
    expect(bogotaDay(new Date('2026-09-18T01:43:30.792Z'))).toBe('2026-09-17');
  });

  it('el día cambia a medianoche de Colombia, no a las siete de la tarde', () => {
    expect(bogotaDay(new Date('2026-09-18T04:59:00.000Z'))).toBe('2026-09-17');
    expect(bogotaDay(new Date('2026-09-18T05:01:00.000Z'))).toBe('2026-09-18');
  });
});

describe('liveStreak', () => {
  it('la racha de hoy vale lo que dice', () => {
    expect(liveStreak(racha({ lastDay: '2026-09-18' }), MEDIODIA)).toBe(3);
  });

  /*
   * Ayer cuenta: la racha no se rompe hasta que el día termina, y decirle a
   * quien jugó ayer que ya la perdió le quita algo que todavía puede conservar.
   */
  it('la racha de ayer sigue viva', () => {
    expect(liveStreak(racha({ lastDay: '2026-09-17' }), MEDIODIA)).toBe(3);
  });

  it('la racha de anteayer está rota, aunque el contador diga otra cosa', () => {
    expect(liveStreak(racha({ lastDay: '2026-09-16' }), MEDIODIA)).toBe(0);
  });

  it('una semana sin entrar deja la racha en cero', () => {
    expect(liveStreak(racha({ current: 12, lastDay: '2026-09-11' }), MEDIODIA)).toBe(0);
  });

  it('sin último día no hay racha que enseñar', () => {
    expect(liveStreak(racha({ lastDay: null }), MEDIODIA)).toBe(0);
    expect(liveStreak(null, MEDIODIA)).toBe(0);
  });

  it('un contador en cero se queda en cero aunque el día sea hoy', () => {
    expect(liveStreak(racha({ current: 0 }), MEDIODIA)).toBe(0);
  });

  /* El cambio de mes, que es donde restar un día a mano suele fallar. */
  it('cruza el cambio de mes', () => {
    const primeroDeOctubre = new Date('2026-10-01T17:00:00.000Z');

    expect(liveStreak(racha({ lastDay: '2026-09-30' }), primeroDeOctubre)).toBe(3);
    expect(liveStreak(racha({ lastDay: '2026-09-29' }), primeroDeOctubre)).toBe(0);
  });
});

describe('streakLabel', () => {
  /* «1 días» era lo que salía en la barra lateral, visto en pantalla el 20-sep-2026. */
  it('un día va en singular', () => {
    expect(streakLabel(1)).toBe('1 día');
  });

  it('el resto en plural, cero incluido', () => {
    expect(streakLabel(0)).toBe('0 días');
    expect(streakLabel(2)).toBe('2 días');
    expect(streakLabel(30)).toBe('30 días');
  });
});
