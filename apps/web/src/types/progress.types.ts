import type { Database } from './database.types';

type UserProgressRow = Database['public']['Tables']['user_progress']['Row'];
type LevelAttemptRow = Database['public']['Tables']['level_attempts']['Row'];
type LeaderboardRow = Database['public']['Views']['leaderboard_weekly']['Row'];

export interface UserProgress {
  completed: UserProgressRow['completed'];
  completedAt: UserProgressRow['completed_at'];
  createdAt: UserProgressRow['created_at'];
  id: UserProgressRow['id'];
  levelId: UserProgressRow['level_id'];
  stars: UserProgressRow['stars'];
  updatedAt: UserProgressRow['updated_at'];
  userId: UserProgressRow['user_id'];
}

export interface LevelAttempt {
  code: LevelAttemptRow['code'];
  createdAt: LevelAttemptRow['created_at'];
  id: LevelAttemptRow['id'];
  levelId: LevelAttemptRow['level_id'];
  success: LevelAttemptRow['success'];
  userId: LevelAttemptRow['user_id'];
}

export interface LeaderboardEntry {
  avatarUrl: LeaderboardRow['avatar_url'];
  fullName: LeaderboardRow['full_name'];
  rank: LeaderboardRow['rank'];
  userId: LeaderboardRow['user_id'];
  xp: LeaderboardRow['xp'];
}
