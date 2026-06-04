import { useEffect, useState } from 'react';
import type { AppError } from '../errors/AppError';
import { worldsService } from '../services/worlds.service';
import type { Level, World } from '../types/world.types';

interface UseWorldsReturn {
  error: AppError | null;
  fetchLevels: (worldId: string) => Promise<boolean>;
  levels: Level[];
  loading: boolean;
  worlds: World[];
}

export const useWorlds = (): UseWorldsReturn => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    const fetchWorlds = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      const result = await worldsService.getWorlds();

      if (result.error) {
        setError(result.error);
      } else {
        setWorlds(result.data ?? []);
      }

      setLoading(false);
    };

    void fetchWorlds();
  }, []);

  const fetchLevels = async (worldId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const result = await worldsService.getLevelsByWorld(worldId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return false;
    }

    setLevels(result.data ?? []);
    setLoading(false);
    return true;
  };

  return {
    error,
    fetchLevels,
    levels,
    loading,
    worlds,
  };
};
