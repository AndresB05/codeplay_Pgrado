import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type { LeaderboardEntry } from '../types/progress.types';

type LeaderboardRow = Database['public']['Views']['leaderboard_weekly']['Row'];

const mapLeaderboardRow = (entry: LeaderboardRow): LeaderboardEntry => {
  return {
    avatarUrl: entry.avatar_url,
    fullName: entry.full_name,
    rank: entry.rank,
    userId: entry.user_id,
    xp: entry.xp,
  };
};

export const leaderboardService = {
  async getWeeklyLeaderboard(): ServiceResult<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('leaderboard_weekly')
      .select('*')
      .order('xp', { ascending: false })
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
