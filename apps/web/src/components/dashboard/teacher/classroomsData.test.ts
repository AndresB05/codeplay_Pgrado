import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildInitials,
  buildWorldProgress,
  formatLastActivity,
  formatRelativeTime,
  generatePublicId,
  getClassGroupStats,
  getClassroomProgressSummary,
  isExactIdSearch,
  isWorldFinished,
  matchesGroupSearch,
  pickAvatarTone,
} from './classroomsData';
import type { CatalogWorld } from '../../../services/studentProgress.service';
import type {
  ClassGroup,
  ClassroomStudent,
  LevelAttempt,
  LevelProgress,
  StudentProgressDetail,
} from '../../../types/classroom.types';

const buildTestStudent = (overrides: Partial<ClassroomStudent> = {}): ClassroomStudent => ({
  id: 's-test',
  name: 'Alumno Prueba',
  initials: 'AP',
  avatarTone: 'bg-grape-soft text-grape-dark',
  currentWorld: 'Mundo 1',
  hoursSinceLastActivity: 3,
  streakDays: 4,
  xp: 0,
  attemptedLevels: 3,
  completedLevels: 2,
  completedWorlds: 0,
  totalAttempts: 5,
  averageBestScore: 80,
  ...overrides,
});

/*
 * El catálogo sembrado que hay contra la base real el 18-sep-2026: tres mundos
 * de tres niveles cada uno. Los tests que cuentan denominadores se apoyan en
 * él, así que las cifras que verifican son las mismas que se ven en pantalla.
 */
const buildTestCatalog = (): CatalogWorld[] => [
  {
    worldId: 'w1',
    title: 'Sendero de los Patrones',
    levels: [
      { levelId: 'w1-l1', title: 'Siempre adelante' },
      { levelId: 'w1-l2', title: 'Camino con curvas' },
      { levelId: 'w1-l3', title: 'La escalera' },
    ],
  },
  {
    worldId: 'w2',
    title: 'Cordillera de la Abstracción',
    levels: [
      { levelId: 'w2-l1', title: 'Salta y sube' },
      { levelId: 'w2-l2', title: 'El gran rodeo' },
      { levelId: 'w2-l3', title: 'La torre' },
    ],
  },
  {
    worldId: 'w3',
    title: 'Encrucijada de las Decisiones',
    levels: [
      { levelId: 'w3-l1', title: 'Dos caminos' },
      { levelId: 'w3-l2', title: 'El faro' },
      { levelId: 'w3-l3', title: 'Muchos caminos' },
    ],
  },
];

const buildTestProgress = (overrides: Partial<LevelProgress> = {}): LevelProgress => ({
  levelId: 'w1-l1',
  levelTitle: 'Siempre adelante',
  worldId: 'w1',
  worldTitle: 'Sendero de los Patrones',
  worldSortOrder: 1,
  levelSortOrder: 1,
  completed: true,
  bestScore: 100,
  attemptCount: 1,
  optimalSteps: 4,
  ...overrides,
});

const buildTestAttempt = (overrides: Partial<LevelAttempt> = {}): LevelAttempt => ({
  attemptId: 'a1',
  levelId: 'w1-l1',
  isSuccess: true,
  score: 100,
  steps: 4,
  createdAtIso: '2026-09-18T01:00:00.000Z',
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

describe('getClassroomProgressSummary', () => {
  const CATALOG = buildTestCatalog();

  it('cuenta el catálogo entero por cada inscrito, también por los que no han jugado', () => {
    const group = buildTestGroup({
      students: [
        buildTestStudent({
          id: 's1',
          attemptedLevels: 9,
          completedLevels: 9,
          completedWorlds: 3,
          totalAttempts: 29,
          averageBestScore: 100,
        }),
        buildTestStudent({
          id: 's2',
          attemptedLevels: 0,
          completedLevels: 0,
          completedWorlds: 0,
          totalAttempts: 0,
          averageBestScore: null,
        }),
        buildTestStudent({
          id: 's3',
          attemptedLevels: 0,
          completedLevels: 0,
          completedWorlds: 0,
          totalAttempts: 0,
          averageBestScore: null,
        }),
      ],
    });

    const summary = getClassroomProgressSummary([group], CATALOG);

    expect(summary.totalStudents).toBe(3);
    expect(summary.activeStudents).toBe(1);
    expect(summary.completedLevels).toBe(9);
    expect(summary.completedWorlds).toBe(3);
    expect(summary.reachableLevels).toBe(27);
    expect(summary.reachableWorlds).toBe(9);
  });

  it('promedia la eficiencia sólo entre quienes han superado algo', () => {
    const group = buildTestGroup({
      students: [
        buildTestStudent({ id: 's1', attemptedLevels: 2, averageBestScore: 100 }),
        buildTestStudent({ id: 's2', attemptedLevels: 2, averageBestScore: 60 }),
        buildTestStudent({ id: 's3', attemptedLevels: 0, averageBestScore: null }),
      ],
    });

    /* Con el tercero dentro saldría 53, que diría que el salón va mal y no es verdad. */
    expect(getClassroomProgressSummary([group], CATALOG).averageBestScore).toBe(80);
  });

  it('deja la eficiencia en null cuando nadie ha superado nada', () => {
    const group = buildTestGroup({
      students: [buildTestStudent({ attemptedLevels: 0, completedLevels: 0, averageBestScore: null })],
    });

    expect(getClassroomProgressSummary([group], CATALOG).averageBestScore).toBeNull();
  });

  it('suma los alumnos de todos los salones del alcance', () => {
    const uno = buildTestGroup({
      id: 'g1',
      students: [buildTestStudent({ id: 's1', completedLevels: 4, completedWorlds: 1 })],
    });
    const dos = buildTestGroup({
      id: 'g2',
      students: [buildTestStudent({ id: 's2', completedLevels: 3, completedWorlds: 1 })],
    });

    const summary = getClassroomProgressSummary([uno, dos], CATALOG);

    expect(summary.completedLevels).toBe(7);
    expect(summary.completedWorlds).toBe(2);
    expect(summary.reachableLevels).toBe(18);
  });

  it('devuelve el caso vacío sin dividir entre cero', () => {
    const summary = getClassroomProgressSummary([], CATALOG);

    expect(summary.totalStudents).toBe(0);
    expect(summary.activeStudents).toBe(0);
    expect(summary.reachableLevels).toBe(0);
    expect(summary.averageBestScore).toBeNull();
  });

  it('no inventa denominador mientras el catálogo no ha llegado', () => {
    const group = buildTestGroup({ students: [buildTestStudent({ completedLevels: 2 })] });

    const summary = getClassroomProgressSummary([group], []);

    expect(summary.reachableLevels).toBe(0);
    expect(summary.reachableWorlds).toBe(0);
  });
});

describe('buildWorldProgress', () => {
  const sinJugar: StudentProgressDetail = { levels: [], attemptsByLevel: {} };

  /*
   * El caso que motivó el paso 31, medido contra la base con la segunda cuenta
   * del salón de pruebas: dos mundos empezados por su primer nivel, ninguno
   * terminado, y un tercero sin tocar que antes no salía en ninguna parte.
   */
  it('saca los tres mundos aunque el explorador sólo haya jugado dos niveles', () => {
    const detail: StudentProgressDetail = {
      levels: [
        buildTestProgress({ levelId: 'w1-l1' }),
        buildTestProgress({
          levelId: 'w3-l1',
          levelTitle: 'Dos caminos',
          worldId: 'w3',
          worldTitle: 'Encrucijada de las Decisiones',
          worldSortOrder: 3,
        }),
      ],
      attemptsByLevel: {},
    };

    const worlds = buildWorldProgress(buildTestCatalog(), detail);

    expect(worlds.map((world) => world.title)).toEqual([
      'Sendero de los Patrones',
      'Cordillera de la Abstracción',
      'Encrucijada de las Decisiones',
    ]);
    expect(worlds.map((world) => `${world.completedLevels} de ${world.totalLevels}`)).toEqual([
      '1 de 3',
      '0 de 3',
      '1 de 3',
    ]);
    expect(worlds.every((world) => world.levels.length === 3)).toBe(true);
    expect(worlds.some(isWorldFinished)).toBe(false);
  });

  it('deja en null el progreso de los niveles que nunca empezó', () => {
    const detail: StudentProgressDetail = {
      levels: [buildTestProgress({ levelId: 'w1-l1' })],
      attemptsByLevel: { 'w1-l1': [buildTestAttempt()] },
    };

    const selva = buildWorldProgress(buildTestCatalog(), detail)[0];

    expect(selva?.levels[0]?.progress).not.toBeNull();
    expect(selva?.levels[0]?.attempts).toHaveLength(1);
    expect(selva?.levels[1]?.progress).toBeNull();
    expect(selva?.levels[1]?.attempts).toEqual([]);
    /* El título sale del catálogo: sin fila de progreso no hay de dónde sacarlo. */
    expect(selva?.levels[1]?.title).toBe('Camino con curvas');
  });

  it('con el catálogo entero superado da los tres mundos terminados', () => {
    const catalog = buildTestCatalog();
    const detail: StudentProgressDetail = {
      levels: catalog.flatMap((world) =>
        world.levels.map((level) =>
          buildTestProgress({
            levelId: level.levelId,
            levelTitle: level.title,
            worldId: world.worldId,
            worldTitle: world.title,
          })
        )
      ),
      attemptsByLevel: {},
    };

    const worlds = buildWorldProgress(catalog, detail);

    expect(worlds.filter(isWorldFinished)).toHaveLength(3);
  });

  it('sin nada jugado devuelve el catálogo entero en cero', () => {
    const worlds = buildWorldProgress(buildTestCatalog(), sinJugar);

    expect(worlds).toHaveLength(3);
    expect(worlds.every((world) => world.completedLevels === 0)).toBe(true);
    expect(worlds.flatMap((world) => world.levels)).toHaveLength(9);
    expect(worlds.some(isWorldFinished)).toBe(false);
  });

  /*
   * Despublicar un nivel borraría de la vista del tutor el historial de un
   * niño, y sin ningún error que lo delate. Por eso lo jugado no se pierde.
   */
  it('conserva un nivel jugado que ya no está en el catálogo', () => {
    const detail: StudentProgressDetail = {
      levels: [
        buildTestProgress({
          levelId: 'w1-retirado',
          levelTitle: 'El nivel que se retiró',
        }),
      ],
      attemptsByLevel: { 'w1-retirado': [buildTestAttempt({ levelId: 'w1-retirado' })] },
    };

    const selva = buildWorldProgress(buildTestCatalog(), detail)[0];

    expect(selva?.levels).toHaveLength(4);
    expect(selva?.levels[3]?.title).toBe('El nivel que se retiró');
    expect(selva?.levels[3]?.attempts).toHaveLength(1);
  });

  it('conserva un nivel jugado cuyo mundo tampoco está en el catálogo', () => {
    const detail: StudentProgressDetail = {
      levels: [
        buildTestProgress({
          levelId: 'w9-l1',
          levelTitle: 'Nivel de un mundo retirado',
          worldId: 'w9',
          worldTitle: 'Mundo retirado',
          worldSortOrder: 9,
        }),
      ],
      attemptsByLevel: {},
    };

    const worlds = buildWorldProgress(buildTestCatalog(), detail);

    expect(worlds).toHaveLength(4);
    expect(worlds[3]?.title).toBe('Mundo retirado');
    expect(worlds[3]?.levels).toHaveLength(1);
  });

  it('sin catálogo se queda con lo jugado en vez de no enseñar nada', () => {
    const detail: StudentProgressDetail = {
      levels: [buildTestProgress({ levelId: 'w1-l1' })],
      attemptsByLevel: {},
    };

    const worlds = buildWorldProgress([], detail);

    expect(worlds).toHaveLength(1);
    expect(worlds[0]?.levels).toHaveLength(1);
  });
});

describe('isWorldFinished', () => {
  it('exige todos los niveles superados', () => {
    const worlds = buildWorldProgress(buildTestCatalog(), {
      levels: [
        buildTestProgress({ levelId: 'w1-l1' }),
        buildTestProgress({ levelId: 'w1-l2', completed: false }),
      ],
      attemptsByLevel: {},
    });

    expect(worlds.filter(isWorldFinished)).toHaveLength(0);
  });

  /* Un mundo sin niveles no está terminado: el servidor tampoco lo cuenta. */
  it('no da por terminado un mundo sin niveles', () => {
    const vacio = buildWorldProgress([{ worldId: 'w0', title: 'Mundo vacío', levels: [] }], {
      levels: [],
      attemptsByLevel: {},
    });

    expect(vacio).toHaveLength(1);
    expect(vacio.filter(isWorldFinished)).toHaveLength(0);
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
