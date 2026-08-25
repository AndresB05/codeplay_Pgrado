import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type { LeaderboardEntry } from '../types/progress.types';

type LeaderboardRow = Database['public']['Views']['leaderboard_weekly']['Row'];

const mapLeaderboardRow = (entry: LeaderboardRow): LeaderboardEntry => {
  return {
    avatarKey: entry.avatar_key,
    completedLevels: entry.completed_levels,
    countryCode: entry.country_code,
    rank: entry.rank,
    unlockedAchievements: entry.unlocked_achievements,
    userId: entry.user_id,
    username: entry.username,
    xp: entry.weekly_xp,
  };
};

export const leaderboardService = {
  async getWeeklyLeaderboard(): ServiceResult<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('leaderboard_weekly')
      .select('*')
      .order('weekly_xp', { ascending: false })
      .limit(10);

    if (error) {
      return {
        data: null,
        error: createAppError(
          error,
          'No se pudo cargar el leaderboard semanal.',
          'leaderboard_get_error'
        ),
      };
    }

    return { data: data.map(mapLeaderboardRow), error: null };
  },
};
