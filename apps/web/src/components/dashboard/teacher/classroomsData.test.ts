import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildInitials,
  formatLastActivity,
  formatRelativeTime,
  generatePublicId,
  getClassGroupStats,
  isExactIdSearch,
  matchesGroupSearch,
  pickAvatarTone,
} from './classroomsData';
import type { ClassGroup, ClassroomStudent } from '../../../types/classroom.types';

const buildTestStudent = (overrides: Partial<ClassroomStudent> = {}): ClassroomStudent => ({
  id: 's-test',
  name: 'Alumno Prueba',
  initials: 'AP',
  avatarTone: 'bg-grape-soft text-grape-dark',
  currentWorld: 'Mundo 1',
  hoursSinceLastActivity: 3,
  streakDays: 4,
  xp: 0,
  skills: { sequences: 50, loops: 50, conditionals: 50, debugging: 50, decomposition: 50 },
  ...overrides,
});

const buildTestGroup = (overrides: Partial<ClassGroup> = {}): ClassGroup => {
  const students = overrides.students ?? [];

  return {
    id: 'g-test',
    publicId: 'CP-TEST',
    name: 'Salón de prueba',
    gradeLabel: 'Primero',
    teacherName: 'Sra. Tutora',
    capacity: 10,
    /* Por defecto, el recuento del servidor coincide con los alumnos visibles. */
    memberCount: students.length,
    students,
    pendingRequests: [],
    invitations: [],
    ...overrides,
  };
};

describe('matchesGroupSearch', () => {
  const group = buildTestGroup({ name: 'Salón 1A', publicId: 'CP-1A24' });

  it('devuelve true con la consulta vacía o de sólo espacios', () => {
    expect(matchesGroupSearch(group, '')).toBe(true);
    expect(matchesGroupSearch(group, '   ')).toBe(true);
  });

  it('coincide con parte del nombre sin distinguir mayúsculas', () => {
    expect(matchesGroupSearch(group, 'salón')).toBe(true);
    expect(matchesGroupSearch(group, 'SALÓN 1a')).toBe(true);
    expect(matchesGroupSearch(group, '1A')).toBe(true);
  });

  it('coincide con el ID público exacto', () => {
    expect(matchesGroupSearch(group, 'CP-1A24')).toBe(true);
    expect(matchesGroupSearch(group, '  cp-1a24  ')).toBe(true);
  });

  it('devuelve false cuando no coincide con nada', () => {
    expect(matchesGroupSearch(group, 'química')).toBe(false);
  });
});

describe('isExactIdSearch', () => {
  const groups = [
    buildTestGroup({ id: 'g1', publicId: 'CP-1A24', name: 'Salón 1A' }),
    buildTestGroup({ id: 'g2', publicId: 'CP-2B24', name: 'Salón 2B' }),
  ];

  it('devuelve true cuando la consulta es el ID público de algún salón', () => {
    expect(isExactIdSearch(groups, 'CP-2B24')).toBe(true);
    expect(isExactIdSearch(groups, '  cp-2b24 ')).toBe(true);
  });

  it('devuelve false con la consulta vacía', () => {
    expect(isExactIdSearch(groups, '   ')).toBe(false);
  });

  it('devuelve false con un nombre parcial', () => {
    expect(isExactIdSearch(groups, 'Salón')).toBe(false);
  });
});

describe('generatePublicId', () => {
  it('genera un ID con formato CP-XXXX que no colisiona con los existentes', () => {
    const taken = ['CP-1A24', 'CP-2B24', 'CP-3C24'];
    const existing = taken.map((publicId, index) => buildTestGroup({ id: `g${index}`, publicId }));

    // Sin mockear Math.random: se comprueba la propiedad, no la implementación.
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const generated = generatePublicId(existing);

      expect(generated).toMatch(/^CP-[A-Z2-9]{4}$/);
      expect(taken).not.toContain(generated);
    }
  });

  it('funciona sin salones previos', () => {
    expect(generatePublicId([])).toMatch(/^CP-[A-Z2-9]{4}$/);
  });
});

describe('buildInitials', () => {
  it('toma la inicial de las dos primeras palabras', () => {
    expect(buildInitials('Ana Torres')).toBe('AT');
  });

  it('toma las dos primeras letras de un nombre de una sola palabra', () => {
    expect(buildInitials('Ana')).toBe('AN');
  });

  it('ignora los espacios sobrantes', () => {
    expect(buildInitials('   ana   torres  ')).toBe('AT');
  });

  it('devuelve un interrogante si no hay nombre', () => {
    expect(buildInitials('   ')).toBe('?');
  });
});

describe('getClassGroupStats', () => {
  it('calcula el total, los cupos libres, los activos, el mundo frecuente y la mejor racha', () => {
    const group = buildTestGroup({
      capacity: 10,
      students: [
        buildTestStudent({
          id: 's1',
          currentWorld: 'Mundo 1',
          hoursSinceLastActivity: 3,
          streakDays: 5,
        }),
        buildTestStudent({
          id: 's2',
          currentWorld: 'Mundo 2',
          hoursSinceLastActivity: 30,
          streakDays: 12,
        }),
        buildTestStudent({
          id: 's3',
          currentWorld: 'Mundo 2',
          hoursSinceLastActivity: 24,
          streakDays: 2,
        }),
      ],
    });

    expect(getClassGroupStats(group)).toEqual({
      totalStudents: 3,
      freeSeats: 7,
      activeToday: 2,
      averageWorldLabel: 'Mundo 2',
      bestStreak: 12,
    });
  });

  it('trata al alumno sin actividad como inactivo y con racha cero', () => {
    const group = buildTestGroup({
      capacity: 5,
      students: [
        buildTestStudent({
          id: 's1',
          currentWorld: null,
          hoursSinceLastActivity: null,
          streakDays: null,
        }),
      ],
    });

    expect(getClassGroupStats(group)).toEqual({
      totalStudents: 1,
      freeSeats: 4,
      activeToday: 0,
      averageWorldLabel: '-',
      bestStreak: 0,
    });
  });

  it('no devuelve cupos negativos cuando hay más alumnos que cupos', () => {
    const group = buildTestGroup({
      capacity: 1,
      students: [buildTestStudent({ id: 's1' }), buildTestStudent({ id: 's2' })],
    });

    expect(getClassGroupStats(group).freeSeats).toBe(0);
  });

  it('devuelve el caso vacío sin dividir entre cero', () => {
    const stats = getClassGroupStats(buildTestGroup({ capacity: 8, students: [] }));

    expect(stats).toEqual({
      totalStudents: 0,
      freeSeats: 8,
      activeToday: 0,
      averageWorldLabel: '-',
      bestStreak: 0,
    });
  });
});

describe('formatLastActivity', () => {
  it('describe la ausencia de actividad', () => {
    expect(formatLastActivity(null)).toBe('Sin actividad');
  });

  it('describe los tramos de horas', () => {
    expect(formatLastActivity(0.5)).toBe('hace un momento');
    expect(formatLastActivity(1)).toBe('hace 1 hora');
    expect(formatLastActivity(5)).toBe('hace 5 horas');
    expect(formatLastActivity(23)).toBe('hace 23 horas');
  });

  it('describe los tramos de días', () => {
    expect(formatLastActivity(24)).toBe('hace 1 día');
    expect(formatLastActivity(50)).toBe('hace 2 días');
  });
});

describe('formatRelativeTime', () => {
  const NOW = new Date('2026-08-25T12:00:00.000Z');

  afterEach(() => {
    vi.useRealTimers();
  });

  const freezeClock = () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  };

  it('convierte una fecha pasada en su etiqueta', () => {
    freezeClock();

    expect(formatRelativeTime('2026-08-25T09:00:00.000Z')).toBe('hace 3 horas');
    expect(formatRelativeTime('2026-08-23T12:00:00.000Z')).toBe('hace 2 días');
  });

  it('acota las fechas futuras a "hace un momento"', () => {
    freezeClock();

    expect(formatRelativeTime('2026-08-26T12:00:00.000Z')).toBe('hace un momento');
  });
});

describe('pickAvatarTone', () => {
  it('devuelve siempre el mismo tono para la misma semilla', () => {
    expect(pickAvatarTone('guest-child')).toBe(pickAvatarTone('guest-child'));
  });

  it('devuelve un tono de la lista conocida', () => {
    const tones = [
      'bg-[#EFE5FF] text-[#7C3AED]',
      'bg-[#FFE8CC] text-[#C97A00]',
      'bg-[#DCF5F2] text-[#0F948C]',
      'bg-[#FFE1EC] text-[#C2185B]',
      'bg-[#E4ECFF] text-[#3B5BDB]',
    ];

    expect(tones).toContain(pickAvatarTone('s1'));
  });
});
