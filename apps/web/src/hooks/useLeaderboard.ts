import { useEffect, useState } from 'react';
import type { AppError } from '../errors/AppError';
import { leaderboardService } from '../services/leaderboard.service';
import type { LeaderboardEntry } from '../types/progress.types';

interface UseLeaderboardReturn {
  error: AppError | null;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
}

export const useLeaderboard = (): UseLeaderboardReturn => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      const result = await leaderboardService.getWeeklyLeaderboard();

      if (result.error) {
        setError(result.error);
      } else {
        setLeaderboard(result.data ?? []);
      }

      setLoading(false);
    };

    void fetchLeaderboard();
  }, []);

  return {
    error,
    leaderboard,
    loading,
  };
};
