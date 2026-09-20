import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../errors/AppError';
import { achievementsService, type CatalogAchievement } from '../services/achievements.service';

interface UseAchievementsReturn {
  achievements: CatalogAchievement[];
  loading: boolean;
  error: AppError | null;
  refresh: () => Promise<void>;
}

/**
 * El catálogo de logros con lo conseguido encima.
 *
 * Trae el catálogo ENTERO y no sólo lo ganado, que es lo que el paso 22 cambió:
 * una sala que sólo lista lo conseguido no le dice a nadie qué puede intentar, y
 * con veinte logros la mitad de la gracia está en leer los que faltan.
 */
export const useAchievements = (userId: string | null): UseAchievementsReturn => {
  const [achievements, setAchievements] = useState<CatalogAchievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetch = useCallback(async (): Promise<void> => {
    if (!userId) {
      setAchievements([]);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await achievementsService.getCatalogWithProgress(userId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setAchievements(result.data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { achievements, loading, error, refresh: fetch };
};
