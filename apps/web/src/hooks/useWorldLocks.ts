import { useCallback, useEffect, useState } from 'react';
import { blockingWorld } from '../components/dashboard/student/worldLock';
import { progressService } from '../services/progress.service';
import { worldsService } from '../services/worlds.service';
import type { Level, World } from '../types/world.types';

interface WorldLockData {
  worlds: World[];
  levelsByWorld: Map<string, Level[]>;
  completedIds: Set<string>;
}

interface UseWorldLocksReturn {
  /** El mundo que hay que superar antes de abrir éste, o `null` si está abierto. */
  blockerOf: (worldId: string) => World | null;
  worlds: World[];
  /** Todavía leyendo. Un fallo NO es cargar: termina con todo abierto. */
  loading: boolean;
}

/*
 * El candado de mundos para las pantallas que no cargan ya mundos, niveles y
 * progreso por su cuenta. MIENTRAS CARGA Y ANTE CUALQUIER FALLO TODO ESTÁ
 * ABIERTO, como en el candado de niveles: un corte de red no debe cerrarle a un
 * niño un mundo que quizá ya se ganó. La pantalla de nivel lo vuelve a
 * comprobar, y ésa es la que cuenta.
 */
export const useWorldLocks = (userId: string | null): UseWorldLocksReturn => {
  const [data, setData] = useState<WorldLockData | null>(null);
  const [loading, setLoading] = useState(userId !== null);

  useEffect(() => {
    let mounted = true;
    setData(null);

    if (userId === null) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const load = async (): Promise<void> => {
      const [worlds, progress] = await Promise.all([
        worldsService.getWorlds(),
        progressService.getMyProgress(userId),
      ]);

      if (!mounted) {
        return;
      }

      if (worlds.data === null || progress.data === null) {
        setLoading(false);
        return;
      }

      const levels = await worldsService.getLevelsByWorlds(worlds.data.map((world) => world.id));

      if (!mounted) {
        return;
      }

      setLoading(false);

      if (levels.data === null) {
        return;
      }

      setData({
        worlds: worlds.data,
        levelsByWorld: levels.data,
        completedIds: new Set(
          progress.data
            .filter((item) => item.completionStatus === 'completed')
            .map((item) => item.levelId)
        ),
      });
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const blockerOf = useCallback(
    (worldId: string) =>
      data === null
        ? null
        : blockingWorld(data.worlds, data.levelsByWorld, worldId, data.completedIds),
    [data]
  );

  return { blockerOf, worlds: data?.worlds ?? [], loading };
};
