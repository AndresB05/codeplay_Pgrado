/** Habilidades de pensamiento computacional que sigue el tutor. */
export type SkillKey = 'sequences' | 'loops' | 'conditionals' | 'debugging' | 'decomposition';

export type DifficultyLabel = 'Fácil' | 'Intermedio' | 'Difícil';

export interface ClassroomStudent {
  id: string;
  /** Nombre visible del niño en la lista del salón. */
  name: string;
  /** Iniciales para el avatar de la tabla mientras no hay imagen real. */
  initials: string;
  /** Clases de Tailwind para el color del avatar. */
  avatarTone: string;
  /** Mundo en el que está jugando ahora mismo. `null` si nunca ha entrado. */
  currentWorld: string | null;
  /** Horas transcurridas desde la última sesión. `null` si nunca ha entrado. */
  hoursSinceLastActivity: number | null;
  /** Días consecutivos jugando. `null` si nunca ha entrado. */
  streakDays: number | null;
  /** Experiencia acumulada. Vale 0 hasta que el juego escriba progreso. */
  xp: number;
  /** Dominio de 0 a 100 por habilidad. */
  skills: Record<SkillKey, number>;
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

/** Invitación enviada por correo desde el panel del tutor. */
export interface EmailInvitation {
  id: string;
  email: string;
  sentAtIso: string;
  status: 'pending' | 'accepted';
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
  /** Profesor a cargo del salón. */
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
  /** Invitaciones por correo enviadas desde este salón. */
  invitations: EmailInvitation[];
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

export interface SkillReport {
  key: SkillKey;
  label: string;
  description: string;
  /** Promedio de dominio del salón, de 0 a 100. */
  mastery: number;
  /** Niños que superan el umbral de dominio. */
  studentsMastered: number;
  /** Niños evaluados en la habilidad. */
  studentsEvaluated: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  skill: SkillKey;
  difficultyLabel: DifficultyLabel;
  estimatedMinutes: number;
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
