import type { CatalogWorld } from '../../../services/studentProgress.service';
import type { ClassGroup, StudentProgressDetail } from '../../../types/classroom.types';
import { buildWorldProgress } from './classroomsData';

export type ReportLevelStatus = 'Superado' | 'Sin superar' | 'Sin empezar';

/** Una fila del resumen: un explorador. `null` es «no existe», nunca cero. */
export interface ReportSummaryRow {
  studentId: string;
  studentName: string;
  xp: number;
  streakDays: number | null;
  completedLevels: number;
  catalogLevels: number;
  completedWorlds: number;
  catalogWorlds: number;
  averageBestScore: number | null;
  totalAttempts: number;
  lastActivityIso: string | null;
}

/** Una fila del detalle: un explorador en un nivel del catálogo. */
export interface ReportDetailRow {
  studentId: string;
  studentName: string;
  worldTitle: string;
  levelTitle: string;
  status: ReportLevelStatus;
  bestScore: number | null;
  attemptCount: number | null;
  fewestSteps: number | null;
  optimalSteps: number | null;
}

export interface ClassroomReport {
  groupName: string;
  publicId: string;
  generatedAt: Date;
  summary: ReportSummaryRow[];
  detail: ReportDetailRow[];
}

const EMPTY_DETAIL: StudentProgressDetail = { levels: [], attemptsByLevel: {} };

/*
 * El óptimo vive en el progreso y no en el catálogo, así que un nivel que este
 * explorador no ha empezado lo toma de cualquier compañero que sí lo jugó. Si
 * nadie del salón lo ha jugado, se queda vacío.
 */
const collectOptimalSteps = (
  details: Record<string, StudentProgressDetail>
): Map<string, number> => {
  const optimal = new Map<string, number>();

  Object.values(details).forEach((detail) => {
    detail.levels.forEach((level) => {
      if (level.optimalSteps !== null) {
        optimal.set(level.levelId, level.optimalSteps);
      }
    });
  });

  return optimal;
};

const findLastActivity = (detail: StudentProgressDetail): string | null => {
  let latest: string | null = null;

  Object.values(detail.attemptsByLevel).forEach((attempts) => {
    attempts.forEach((attempt) => {
      if (
        attempt.createdAtIso &&
        (latest === null || Date.parse(attempt.createdAtIso) > Date.parse(latest))
      ) {
        latest = attempt.createdAtIso;
      }
    });
  });

  return latest;
};

/**
 * Las filas del reporte de un salón, ya decididas, para que los formatos sólo
 * las pinten.
 *
 * Quién entra lo decide el roster y no el detalle: la vista puede traer a quien
 * acaba de salir del salón, y una solicitud pendiente no es un miembro.
 */
export const buildClassroomReport = (
  group: ClassGroup,
  catalog: CatalogWorld[],
  details: Record<string, StudentProgressDetail>,
  now: Date
): ClassroomReport => {
  const catalogLevels = catalog.reduce((total, world) => total + world.levels.length, 0);
  const optimalByLevel = collectOptimalSteps(details);

  const summary: ReportSummaryRow[] = [];
  const detail: ReportDetailRow[] = [];

  group.students.forEach((student) => {
    const studentDetail = details[student.id] ?? EMPTY_DETAIL;

    summary.push({
      studentId: student.id,
      studentName: student.name,
      xp: student.xp,
      streakDays: student.streakDays,
      completedLevels: student.completedLevels,
      catalogLevels,
      completedWorlds: student.completedWorlds,
      catalogWorlds: catalog.length,
      averageBestScore: student.averageBestScore,
      totalAttempts: student.totalAttempts,
      lastActivityIso: findLastActivity(studentDetail),
    });

    buildWorldProgress(catalog, studentDetail).forEach((world) => {
      world.levels.forEach((level) => {
        const successfulSteps = level.attempts
          .filter((attempt) => attempt.isSuccess && attempt.steps !== null)
          .map((attempt) => attempt.steps as number);

        let status: ReportLevelStatus = 'Sin empezar';

        if (level.progress) {
          status = level.progress.completed ? 'Superado' : 'Sin superar';
        }

        detail.push({
          studentId: student.id,
          studentName: student.name,
          worldTitle: world.title,
          levelTitle: level.title,
          status,
          bestScore: level.progress?.bestScore ?? null,
          attemptCount: level.progress?.attemptCount ?? null,
          fewestSteps: successfulSteps.length > 0 ? Math.min(...successfulSteps) : null,
          optimalSteps: level.progress?.optimalSteps ?? optimalByLevel.get(level.levelId) ?? null,
        });
      });
    });
  });

  return {
    groupName: group.name,
    publicId: group.publicId,
    generatedAt: now,
    summary,
    detail,
  };
};

const pad = (value: number): string => String(value).padStart(2, '0');

/** AAAA-MM-DD en la hora local de quien exporta, que es el día que espera leer. */
export const formatReportDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** AAAA-MM-DD HH:MM en hora local. */
export const formatReportDateTime = (iso: string): string => {
  const date = new Date(iso);

  return `${formatReportDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export type ReportFileKind = 'resumen' | 'detalle' | 'reporte';

export const buildReportFileName = (publicId: string, kind: ReportFileKind, now: Date): string =>
  `codeplay-${publicId}-${kind}-${formatReportDate(now)}.${kind === 'reporte' ? 'pdf' : 'csv'}`;
