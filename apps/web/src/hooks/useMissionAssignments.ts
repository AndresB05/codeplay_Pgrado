import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../errors/AppError';
import { missionsService, type MissionAssignment } from '../services/missions.service';
import { useAuth } from './useAuth';

interface UseMissionAssignmentsReturn {
  assignments: MissionAssignment[];
  loading: boolean;
  error: AppError | null;
  assign: (missionKey: string, groupIds: string[]) => Promise<boolean>;
  unassign: (missionKey: string, groupIds: string[]) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Las misiones asignadas que ve quien tiene la sesión abierta: las de su salón
 * si es niño, las de sus salones si es tutor. Quién ve qué lo decide la RLS, no
 * este hook.
 */
export const useMissionAssignments = (): UseMissionAssignmentsReturn => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [assignments, setAssignments] = useState<MissionAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!userId) {
      setAssignments([]);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await missionsService.listAssignments();

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setAssignments(result.data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /*
   * Se recarga el estado entero tras cada escritura, como hace el store de
   * salones: la consulta es barata y evita una familia de errores de sincronía,
   * como una tarjeta pintada «Asignada» por una escritura que el servidor
   * rechazó.
   */
  const runWrite = useCallback(
    async (operation: () => Promise<{ error: AppError | null }>): Promise<boolean> => {
      setError(null);

      const result = await operation();

      if (result.error) {
        setError(result.error);
        return false;
      }

      await refresh();
      return true;
    },
    [refresh]
  );

  const assign = useCallback(
    async (missionKey: string, groupIds: string[]): Promise<boolean> => {
      if (!userId) {
        return false;
      }

      return runWrite(() => missionsService.assignMission(missionKey, groupIds, userId));
    },
    [runWrite, userId]
  );

  const unassign = useCallback(
    async (missionKey: string, groupIds: string[]): Promise<boolean> => {
      return runWrite(() => missionsService.unassignMission(missionKey, groupIds));
    },
    [runWrite]
  );

  return { assignments, loading, error, assign, unassign, refresh };
};
