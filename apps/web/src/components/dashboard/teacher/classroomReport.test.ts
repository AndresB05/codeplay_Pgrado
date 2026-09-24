import { describe, expect, it } from 'vitest';
import { buildClassroomReport, buildReportFileName } from './classroomReport';
import type { CatalogWorld } from '../../../services/studentProgress.service';
import type {
  ClassGroup,
  ClassroomStudent,
  LevelAttempt,
  LevelProgress,
  StudentProgressDetail,
} from '../../../types/classroom.types';

const NOW = new Date(2026, 8, 24, 10, 30);

const CATALOG: CatalogWorld[] = [1, 2, 3].map((world) => ({
  worldId: `w${world}`,
  title: `Mundo ${world}`,
  levels: [1, 2, 3].map((level) => ({
    levelId: `w${world}-l${level}`,
    title: `Nivel ${world}.${level}`,
  })),
}));

const buildStudent = (overrides: Partial<ClassroomStudent> = {}): ClassroomStudent => ({
  id: 's1',
  name: 'Axoluk',
  initials: 'AX',
  avatarTone: '',
  currentWorld: null,
  hoursSinceLastActivity: null,
  streakDays: null,
  xp: 0,
  attemptedLevels: 0,
  completedLevels: 0,
  completedWorlds: 0,
  totalAttempts: 0,
  averageBestScore: null,
  ...overrides,
});

const buildGroup = (students: ClassroomStudent[]): ClassGroup => ({
  id: 'g1',
  publicId: 'CP-PJE6',
  name: 'salon pinpon',
  gradeLabel: '3°',
  teacherName: 'Tutor',
  capacity: 30,
  memberCount: students.length,
  students,
  pendingRequests: [
    {
      id: 'r1',
      studentId: 'pendiente',
      studentName: 'Pendiente',
      initials: 'PE',
      avatarTone: '',
      requestedAtIso: '2026-09-20T10:00:00Z',
    },
  ],
});

const buildProgress = (overrides: Partial<LevelProgress> = {}): LevelProgress => ({
  levelId: 'w1-l1',
  levelTitle: 'Nivel 1.1',
  worldId: 'w1',
  worldTitle: 'Mundo 1',
  worldSortOrder: 1,
  levelSortOrder: 1,
  completed: true,
  bestScore: 100,
  attemptCount: 2,
  optimalSteps: 4,
  ...overrides,
});

const buildAttempt = (overrides: Partial<LevelAttempt> = {}): LevelAttempt => ({
  attemptId: 'a1',
  levelId: 'w1-l1',
  isSuccess: true,
  score: 100,
  steps: 4,
  createdAtIso: '2026-09-18T01:43:30Z',
  ...overrides,
});

describe('buildClassroomReport', () => {
  it('trae una fila de detalle por explorador y nivel del catálogo, jueguen lo que jueguen', () => {
    const report = buildClassroomReport(
      buildGroup([buildStudent(), buildStudent({ id: 's2', name: 'Invitada' })]),
      CATALOG,
      {},
      NOW
    );

    expect(report.summary).toHaveLength(2);
    expect(report.detail).toHaveLength(18);
  });

  it('deja sin cifra a quien no ha jugado, en vez de escribir ceros', () => {
    const report = buildClassroomReport(buildGroup([buildStudent()]), CATALOG, {}, NOW);

    expect(report.summary[0]).toMatchObject({
      completedLevels: 0,
      catalogLevels: 9,
      catalogWorlds: 3,
      averageBestScore: null,
      lastActivityIso: null,
    });
    expect(report.detail.every((row) => row.status === 'Sin empezar')).toBe(true);
    expect(report.detail[0]).toMatchObject({ bestScore: null, attemptCount: null });
  });

  it('distingue un nivel empezado y no superado, sin menos pasos', () => {
    const detail: StudentProgressDetail = {
      levels: [buildProgress({ completed: false, bestScore: 0, attemptCount: 3 })],
      attemptsByLevel: { 'w1-l1': [buildAttempt({ isSuccess: false, score: 0, steps: 9 })] },
    };

    const report = buildClassroomReport(buildGroup([buildStudent()]), CATALOG, { s1: detail }, NOW);

    expect(report.detail[0]).toMatchObject({
      status: 'Sin superar',
      attemptCount: 3,
      fewestSteps: null,
    });
  });

  it('toma los menos pasos de las partidas superadas y deja vacío lo que no se contó', () => {
    const detail: StudentProgressDetail = {
      levels: [
        buildProgress(),
        buildProgress({ levelId: 'w1-l2', levelTitle: 'Nivel 1.2', levelSortOrder: 2 }),
      ],
      attemptsByLevel: {
        'w1-l1': [
          buildAttempt({ attemptId: 'a1', steps: 12 }),
          buildAttempt({ attemptId: 'a2', steps: 5 }),
          buildAttempt({ attemptId: 'a3', steps: 3, isSuccess: false }),
        ],
        'w1-l2': [buildAttempt({ attemptId: 'a4', levelId: 'w1-l2', steps: null })],
      },
    };

    const report = buildClassroomReport(buildGroup([buildStudent()]), CATALOG, { s1: detail }, NOW);

    expect(report.detail[0]).toMatchObject({ status: 'Superado', fewestSteps: 5 });
    expect(report.detail[1]).toMatchObject({ status: 'Superado', fewestSteps: null });
  });

  it('fecha la última actividad con la partida más reciente', () => {
    const detail: StudentProgressDetail = {
      levels: [buildProgress()],
      attemptsByLevel: {
        'w1-l1': [
          buildAttempt({ attemptId: 'a1', createdAtIso: '2026-09-03T01:28:31Z' }),
          buildAttempt({ attemptId: 'a2', createdAtIso: '2026-09-18T01:43:30Z' }),
        ],
      },
    };

    const report = buildClassroomReport(buildGroup([buildStudent()]), CATALOG, { s1: detail }, NOW);

    expect(report.summary[0].lastActivityIso).toBe('2026-09-18T01:43:30Z');
  });

  it('conserva el nivel despublicado que tiene progreso', () => {
    const detail: StudentProgressDetail = {
      levels: [buildProgress({ levelId: 'viejo', levelTitle: 'Nivel retirado' })],
      attemptsByLevel: {},
    };

    const report = buildClassroomReport(buildGroup([buildStudent()]), CATALOG, { s1: detail }, NOW);

    expect(report.detail).toHaveLength(10);
    expect(report.detail.some((row) => row.levelTitle === 'Nivel retirado')).toBe(true);
  });

  it('toma el óptimo de un compañero para el nivel que este explorador no empezó', () => {
    const played: StudentProgressDetail = {
      levels: [buildProgress({ optimalSteps: 7 })],
      attemptsByLevel: {},
    };

    const report = buildClassroomReport(
      buildGroup([buildStudent(), buildStudent({ id: 's2', name: 'Invitada' })]),
      CATALOG,
      { s1: played },
      NOW
    );

    const unstarted = report.detail.find(
      (row) => row.studentName === 'Invitada' && row.levelTitle === 'Nivel 1.1'
    );

    expect(unstarted).toMatchObject({ status: 'Sin empezar', optimalSteps: 7 });
  });

  it('no mete a quien la vista trae pero ya no es miembro, ni a una solicitud pendiente', () => {
    const report = buildClassroomReport(
      buildGroup([buildStudent()]),
      CATALOG,
      {
        s1: { levels: [], attemptsByLevel: {} },
        expulsado: { levels: [buildProgress()], attemptsByLevel: {} },
      },
      NOW
    );

    const names = new Set(report.detail.map((row) => row.studentName));

    expect(report.summary.map((row) => row.studentName)).toEqual(['Axoluk']);
    expect([...names]).toEqual(['Axoluk']);
  });
});

describe('buildReportFileName', () => {
  it('lleva el ID público, el tipo y la fecha local', () => {
    expect(buildReportFileName('CP-PJE6', 'resumen', NOW)).toBe(
      'codeplay-CP-PJE6-resumen-2026-09-24.csv'
    );
    expect(buildReportFileName('CP-PJE6', 'reporte', NOW)).toBe(
      'codeplay-CP-PJE6-reporte-2026-09-24.pdf'
    );
  });
});
