import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../errors/AppError';
import { invitationsService, type Invitation } from '../services/invitations.service';
import { useAuth } from './useAuth';

interface UseInvitationsReturn {
  invitations: Invitation[];
  loading: boolean;
  error: AppError | null;
  /** Devuelve el enlace generado, o `null` si la base lo rechazó. */
  create: () => Promise<Invitation | null>;
  revoke: (invitationId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Los enlaces de invitación de un salón del tutor.
 *
 * Vive fuera del store de salones a propósito, como las asignaciones de misiones
 * desde el paso 16: una lista de enlaces no es la pertenencia de nadie, y el
 * store posee la pertenencia. El canje sí entra por el store, porque su efecto
 * **es** una pertenencia — el criterio es de quién es el efecto, no qué tabla se
 * toca.
 */
export const useInvitations = (groupId: string | null): UseInvitationsReturn => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  /**
   * El único camino de carga, con la forma de `useMissionAssignments`: `silent`
   * decide si se declara la espera, y **todos** los `setLoading(false)` se
   * conservan en los dos caminos.
   */
  const runLoad = useCallback(
    async (silent: boolean): Promise<void> => {
      if (!userId || !groupId) {
        setInvitations([]);

        return;
      }

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      /*
       * Purgar ANTES de listar, no después: es lo que cumple el plazo de
       * conservación de 14 días sin maquinaria nueva, y de paso evita pintar
       * una fila que se va a borrar. Su fallo NO corta la lectura —quedarse sin
       * ver los enlaces por no haber podido limpiar sería peor que no limpiar—,
       * pero tampoco se traga: si la lista sale bien, el error de la purga se
       * descarta porque no hay nada que el tutor pueda hacer con él.
       */
      await invitationsService.purgeExpired([groupId]);

      const result = await invitationsService.listInvitations([groupId]);

      if (result.error) {
        setError(result.error);
        setLoading(false);

        return;
      }

      setInvitations(result.data ?? []);
      setError(null);
      setLoading(false);
    },
    [groupId, userId]
  );

  const refresh = useCallback((): Promise<void> => runLoad(false), [runLoad]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /*
   * Se recarga la lista entera tras cada escritura, como hacen el store y las
   * misiones: la consulta es barata y evita pintar un enlace que el servidor
   * rechazó.
   */
  const create = useCallback(async (): Promise<Invitation | null> => {
    if (!userId || !groupId) {
      return null;
    }

    setError(null);

    const result = await invitationsService.createInvitation(groupId, userId);

    if (result.error || !result.data) {
      setError(result.error);

      return null;
    }

    await refresh();

    return result.data;
  }, [groupId, refresh, userId]);

  const revoke = useCallback(
    async (invitationId: string): Promise<boolean> => {
      setError(null);

      const result = await invitationsService.deleteInvitation(invitationId);

      if (result.error) {
        setError(result.error);

        return false;
      }

      await refresh();

      return true;
    },
    [refresh]
  );

  return { invitations, loading, error, create, revoke, refresh };
};
