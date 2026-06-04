import { useEffect, useState } from 'react';
import type { AppError } from '../errors/AppError';
import { achievementsService, type AchievementWithProgress } from '../services/achievements.service';

interface UseAchievementsReturn {
  achievements: AchievementWithProgress[];
  loading: boolean;
  error: AppError | null;
  refresh: () => Promise<void>;
}

export const useAchievements = (userId: string | null): UseAchievementsReturn => {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetch = async (): Promise<void> => {
    if (!userId) {
      setAchievements([]);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await achievementsService.getAchievementsForUser(userId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setAchievements(result.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    achievements,
    loading,
    error,
    refresh: fetch,
  };
};
