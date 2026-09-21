import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../errors/AppError';
import {
  missionsService,
  type MissionAssignment,
  type MissionCompletion,
} from '../services/missions.service';
import type { Mission } from '../types/classroom.types';
import { useAuth } from './useAuth';

interface UseMissionAssignmentsReturn {
  /** El catálogo entero, en su orden. Desde que vive en la base. */
  catalog: Mission[];
  assignments: MissionAssignment[];
  /** Lo cumplido que quien mira puede ver: lo suyo, o lo de sus alumnos. */
  completions: MissionCompletion[];
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

  const [catalog, setCatalog] = useState<Mission[]>([]);
  const [assignments, setAssignments] = useState<MissionAssignment[]>([]);
  const [completions, setCompletions] = useState<MissionCompletion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  /**
   * El único camino de carga, como en el store de salones. `silent` separa lo
   * que hizo quien mira de lo que hizo su tutor desde otra sesión: la recarga
   * ajena no declara espera —este panel devuelve `null` mientras carga, así que
   * declararla lo haría desaparecer y volver— pero **sí la apaga**.
   *
   * El error tampoco se limpia de entrada en el camino silencioso: la pantalla
   * pinta el motivo en lugar del panel, y borrarlo para reponerlo un instante
   * después es el mismo parpadeo por otra puerta. Se fija con el resultado.
   */
  const runLoad = useCallback(
    async (silent: boolean): Promise<void> => {
      if (!userId) {
        setCatalog([]);
        setAssignments([]);
        setCompletions([]);
        return;
      }

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      /*
       * Las tres a la vez: son tres alcances distintos —el catálogo lo lee
       * cualquiera con sesión, las asignaciones y los cumplimientos los acota la
       * RLS— y pedirlas en serie triplicaría la espera sin ganar nada.
       *
       * Un fallo en cualquiera de las tres deja el estado como estaba y pinta el
       * motivo. Quedarse con dos de tres enseñaría una misión sin saber si está
       * cumplida, que es peor que decir que no se pudo cargar.
       */
      const [catalogResult, assignmentsResult, completionsResult] = await Promise.all([
        missionsService.listCatalog(),
        missionsService.listAssignments(),
        missionsService.listCompletions(),
      ]);

      const readError = catalogResult.error ?? assignmentsResult.error ?? completionsResult.error;

      if (readError) {
        setError(readError);
        setLoading(false);
        return;
      }

      setCatalog(catalogResult.data ?? []);
      setAssignments(assignmentsResult.data ?? []);
      setCompletions(completionsResult.data ?? []);
      setError(null);
      setLoading(false);
    },
    [userId]
  );

  const refresh = useCallback((): Promise<void> => runLoad(false), [runLoad]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /* Nunca antes de tener `userId`: ver `ClassroomsProvider`. */
  useEffect(() => {
    if (!userId) {
      return;
    }

    return missionsService.subscribeToAssignments(() => {
      void runLoad(true);
    });
  }, [runLoad, userId]);

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

      return runWrite(() => missionsService.assignMission(missionKey, groupIds));
    },
    [runWrite, userId]
  );

  const unassign = useCallback(
    async (missionKey: string, groupIds: string[]): Promise<boolean> => {
      return runWrite(() => missionsService.unassignMission(missionKey, groupIds));
    },
    [runWrite]
  );

  return { catalog, assignments, completions, loading, error, assign, unassign, refresh };
};
