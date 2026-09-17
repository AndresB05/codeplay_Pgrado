import type { Database } from './database.types';

type UserProgressRow = Database['public']['Tables']['user_progress']['Row'];
type LevelAttemptRow = Database['public']['Tables']['level_attempts']['Row'];
type LeaderboardRow = Database['public']['Views']['leaderboard_weekly']['Row'];

export interface UserProgress {
  attemptCount: UserProgressRow['attempt_count'];
  bestScore: UserProgressRow['best_score'];
  completedAt: UserProgressRow['completed_at'];
  /** `'completed'`, `'in_progress'`… La vista del ranking filtra por este campo. */
  completionStatus: UserProgressRow['completion_status'];
  createdAt: UserProgressRow['created_at'];
  id: UserProgressRow['id'];
  lastAttemptAt: UserProgressRow['last_attempt_at'];
  levelId: UserProgressRow['level_id'];
  stars: UserProgressRow['stars_earned'];
  updatedAt: UserProgressRow['updated_at'];
  userId: UserProgressRow['user_id'];
}

export interface LevelAttempt {
  code: LevelAttemptRow['submitted_code'];
  createdAt: LevelAttemptRow['created_at'];
  id: LevelAttemptRow['id'];
  levelId: LevelAttemptRow['level_id'];
  runtimeMs: LevelAttemptRow['runtime_ms'];
  score: LevelAttemptRow['score'];
  success: LevelAttemptRow['is_success'];
  userId: LevelAttemptRow['user_id'];
}

/*
 * Lo que el servidor devuelve al guardar una partida, que es lo único de la
 * base que la pantalla de nivel necesita después de jugar.
 *
 * `score` es la puntuación QUE CUENTA —la del servidor, contando el programa— y
 * `awardedXp` lo que de verdad se sumó: la diferencia de marca, que puede ser
 * cero si la partida no mejoró la anterior. Ninguno de los dos se puede deducir
 * en el cliente, porque el segundo depende de la marca que ya había.
 */
export interface AttemptOutcome {
  attemptId: string;
  score: number;
  /** Los pasos que contó el servidor, o `null` si no pudo leer el programa. */
  steps: number | null;
  bestScore: number;
  completionStatus: string;
  attemptCount: number;
  awardedXp: number;
  totalXp: number;
}

/** Las columnas de la vista son nullable: se construye con `left join`. */
export interface LeaderboardEntry {
  avatarKey: LeaderboardRow['avatar_key'];
  completedLevels: LeaderboardRow['completed_levels'];
  countryCode: LeaderboardRow['country_code'];
  rank: LeaderboardRow['rank'];
  unlockedAchievements: LeaderboardRow['unlocked_achievements'];
  userId: LeaderboardRow['user_id'];
  username: LeaderboardRow['username'];
  xp: LeaderboardRow['weekly_xp'];
}
