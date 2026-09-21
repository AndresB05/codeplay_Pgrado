import { describe, expect, it } from 'vitest';
import { formatDueDate, isAssignmentActive } from './missionDue';

describe('isAssignmentActive', () => {
  it('sin fecha no vence nunca', () => {
    expect(isAssignmentActive(null, '2026-09-21')).toBe(true);
  });

  it('el último día todavía vale', () => {
    expect(isAssignmentActive('2026-09-21', '2026-09-21')).toBe(true);
  });

  it('al día siguiente ya no', () => {
    expect(isAssignmentActive('2026-09-21', '2026-09-22')).toBe(false);
  });

  it('compara fechas y no texto suelto: cambia de mes bien', () => {
    expect(isAssignmentActive('2026-10-01', '2026-09-30')).toBe(true);
  });
});

describe('formatDueDate', () => {
  it('dice el día y el mes, sin moverse al día anterior', () => {
    expect(formatDueDate('2026-09-25')).toBe('25 de septiembre');
    expect(formatDueDate('2026-10-01')).toBe('1 de octubre');
  });
});
