import { useEffect, useState } from 'react';
import type { AppError } from '../errors/AppError';
import { progressService } from '../services/progress.service';
import type { UserProgress } from '../types/progress.types';

interface UseProgressReturn {
  error: AppError | null;
  loading: boolean;
  progress: UserProgress[];
  upsertProgress: (
    levelId: string,
    completionStatus: string,
    stars: number,
    bestScore?: number
  ) => Promise<boolean>;
}

export const useProgress = (userId: string | null): UseProgressReturn => {
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (!userId) {
      setProgress([]);
      return;
    }

    const fetchProgress = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      const result = await progressService.getMyProgress(userId);

      if (result.error) {
        setError(result.error);
      } else {
        setProgress(result.data ?? []);
      }

      setLoading(false);
    };

    void fetchProgress();
  }, [userId]);

  const upsertProgress = async (
    levelId: string,
    completionStatus: string,
    stars: number,
    bestScore = 0
  ): Promise<boolean> => {
    if (!userId) {
      return false;
    }

    setLoading(true);
    setError(null);

    const result = await progressService.upsertProgress(levelId, completionStatus, bestScore, stars);

    if (result.error || !result.data) {
      setError(result.error);
      setLoading(false);
      return false;
    }

    const savedProgress = result.data;

    setProgress((previousProgress) => {
      const existingIndex = previousProgress.findIndex((item) => item.levelId === levelId);

      if (existingIndex === -1) {
        return [...previousProgress, savedProgress];
      }

      const nextProgress = [...previousProgress];
      nextProgress[existingIndex] = savedProgress;
      return nextProgress;
    });

    setLoading(false);
    return true;
  };

  return {
    error,
    loading,
    progress,
    upsertProgress,
  };
};
