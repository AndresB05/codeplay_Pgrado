export type DifficultyLabel = 'Fácil' | 'Intermedio' | 'Difícil';

export interface ClassroomStudent {
  id: string;
  /** Nombre visible del niño en la lista del salón. */
  name: string;
  /** Iniciales para el avatar de la tabla mientras no hay imagen real. */
  initials: string;
  /** Clases de Tailwind para el color del avatar. */
  avatarTone: string;
  /** Mundo del último nivel intentado. `null` si nunca ha jugado. */
  currentWorld: string | null;
  /** Horas transcurridas desde el último intento. `null` si nunca ha jugado. */
  hoursSinceLastActivity: number | null;
  /** Días consecutivos jugando. `null` si nunca ha entrado. */
  streakDays: number | null;
  /** Experiencia acumulada. */
  xp: number;
  /** Niveles con alguna partida, se hayan superado o no. */
  attemptedLevels: number;
  completedLevels: number;
  completedWorlds: number;
  /** Partidas sumadas de todos sus niveles. */
  totalAttempts: number;
  /**
   * Marca media de eficiencia de lo superado, de 0 a 100. `null` mientras no
   * haya superado nada: promediar lo empezado y no terminado mezclaría ceros
   * que no hablan de eficiencia sino de partidas que no llegaron al final.
   */
  averageBestScore: number | null;
}

/** Cómo le fue a un explorador en un nivel concreto. */
export interface LevelProgress {
  levelId: string;
  levelTitle: string;
  worldId: string;
  worldTitle: string;
  worldSortOrder: number;
  levelSortOrder: number;
  completed: boolean;
  bestScore: number;
  attemptCount: number;
  /** Pasos con los que el nivel se resuelve. `null` si el nivel no lo declara. */
  optimalSteps: number | null;
}

/** Una partida suelta, con lo que costó. */
export interface LevelAttempt {
  attemptId: string;
  levelId: string;
  isSuccess: boolean;
  score: number;
  /**
   * Pasos que contó el servidor leyendo el programa. `null` cuando no supo
   * leerlo: un cero diría que se resolvió sin hacer nada.
   */
  steps: number | null;
  createdAtIso: string;
}

/** El detalle de un explorador: sus niveles y las partidas de cada uno. */
export interface StudentProgressDetail {
  levels: LevelProgress[];
  attemptsByLevel: Record<string, LevelAttempt[]>;
}

/** Solicitud de un niño para entrar a un salón, a la espera del tutor. */
export interface JoinRequest {
  id: string;
  studentId: string;
  studentName: string;
  initials: string;
  avatarTone: string;
  /** Momento en que el niño envió la solicitud, en ISO 8601. */
  requestedAtIso: string;
}

export interface ClassGroup {
  /** Identificador interno, estable y no visible. */
  id: string;
  /** ID público del salón. El niño puede buscarlo tal cual. */
  publicId: string;
  /** Nombre del salón, p. ej. "Salón 1A". */
  name: string;
  /** Grado o curso al que pertenece el salón. */
  gradeLabel: string;
  /** Tutor a cargo del salón. */
  teacherName: string;
  /** Cupos totales del salón. */
  capacity: number;
  /**
   * Alumnos inscritos, contados por el servidor. No siempre coincide con
   * `students.length`: del salón ajeno, el niño conoce cuántos hay pero no
   * quiénes son. Es el número que manda para saber si quedan cupos.
   */
  memberCount: number;
  /** Alumnos que quien consulta puede ver. Vacío en un salón ajeno. */
  students: ClassroomStudent[];
  /** Niños que pidieron entrar y esperan respuesta. */
  pendingRequests: JoinRequest[];
}

export interface ClassGroupStats {
  /** Niños inscritos en el salón. */
  totalStudents: number;
  /** Cupos del salón todavía sin asignar. */
  freeSeats: number;
  /** Niños con actividad en las últimas 24 horas. */
  activeToday: number;
  /** Mundo más frecuente entre los niños del salón. */
  averageWorldLabel: string;
  /** Racha más alta del salón. */
  bestStreak: number;
}

/**
 * Una misión del catálogo, que **vive en la base** desde que se pueden cumplir:
 * `mission_catalog`. Antes eran cinco constantes en `teacher/classroomsData.ts`
 * y `mission_assignments.mission_key` era texto suelto contra ellas.
 *
 * No lleva `skill` ni `estimatedMinutes`: la primera dejó de medir nada al
 * retirarse los reportes de habilidades, y los minutos eran un número inventado.
 */
export interface Mission {
  /** `mission_catalog.mission_key`, a la que apunta la asignación. */
  key: string;
  title: string;
  description: string;
  difficultyLabel: DifficultyLabel;
  /**
   * XP que otorga. Está por encima del nivel más generoso de la siembra (260)
   * porque una misión es un reto especial, no un nivel más. **Se cobra al
   * cumplirla, una sola vez en la vida**, y lo concede el servidor.
   */
  xpReward: number;
}

export interface TeacherResource {
  id: string;
  title: string;
  description: string;
  /** Sección del recurso: cómo se resuelven acertijos, cómo se ganan medallas, etc. */
  categoryLabel: string;
  readMinutes: number;
}

/** Situación del niño de la sesión actual respecto a los salones. */
export type MembershipStatus = 'none' | 'pending' | 'member';

export interface StudentMembership {
  status: MembershipStatus;
  /** Salón al que pertenece o al que solicitó entrar. */
  groupId: string | null;
}

export interface CreateGroupInput {
  name: string;
  gradeLabel: string;
  teacherName: string;
  capacity: number;
}
