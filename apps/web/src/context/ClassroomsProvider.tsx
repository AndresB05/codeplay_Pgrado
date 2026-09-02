import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { classroomsService } from '../services/classrooms.service';
import type { ClassroomsService } from '../services/classrooms.service';
import type { AppError } from '../errors/AppError';
import type { ClassGroup, CreateGroupInput, StudentMembership } from '../types/classroom.types';
import { ClassroomsContext } from './ClassroomsContext';
import type { ClassroomsContextValue } from './ClassroomsContext';

/**
 * Store de salones contra Supabase. Cada acción escribe y vuelve a leer el
 * estado del rol: un salón tiene decenas de filas, la consulta es barata, y
 * recargar evita toda una familia de errores de sincronía —una aceptación que
 * falla por cupo y deja al alumno pintado dentro, por ejemplo—.
 *
 * Es el único archivo que cambia de raíz al conectar el backend: las vistas
 * consumen `useClassrooms()` y no saben de dónde salen los datos.
 */
const EMPTY_MEMBERSHIP: StudentMembership = { status: 'none', groupId: null };

interface ClassroomsProviderProps {
  children: ReactNode;
  /**
   * Sólo lo pasan los tests, para montar el store sin cliente de Supabase.
   * Mantiene la lista de dependencias del provider en un único sitio.
   */
  service?: ClassroomsService;
}

export const ClassroomsProvider = ({
  children,
  service = classroomsService,
}: ClassroomsProviderProps) => {
  const { user } = useAuth();

  /*
   * Del usuario sólo se usan estos dos datos, y de ellos cuelgan todas las
   * dependencias de abajo. El objeto `user` se reconstruye en cada evento de
   * sesión —también en los refrescos de token, que no cambian quién está
   * dentro—, así que depender de él regeneraba todos los callbacks, recargaba el
   * store entero y hacía parpadear el panel del tutor, que cambia su pantalla
   * por un spinner mientras carga. Se depende del dato, no de la identidad del
   * objeto que lo transporta.
   */
  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;

  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [membership, setMembership] = useState<StudentMembership>(EMPTY_MEMBERSHIP);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  /*
   * Cada carga se numera para descartar las respuestas que llegan tarde: al
   * cambiar de sesión, la del usuario anterior puede resolverse después de la
   * nueva y pintar salones ajenos.
   */
  const loadId = useRef(0);

  /**
   * El único camino de carga. `silent` decide si se declara la espera, y es lo
   * que separa lo que hizo quien mira de lo que hizo otra persona.
   *
   * OJO CON LA ASIMETRÍA, QUE NO ES UN DESCUIDO: el camino silencioso se salta
   * el `setLoading(true)` pero **conserva todos los `setLoading(false)`**. Si un
   * evento entra mientras la carga inicial sigue en vuelo, aquélla resuelve, se
   * encuentra el `loadId` cambiado y vuelve sin apagar la espera; si la
   * silenciosa tampoco la apagara, el indicador se quedaría encendido para
   * siempre.
   */
  const runLoad = useCallback(
    async (silent: boolean): Promise<void> => {
      const currentLoad = loadId.current + 1;
      loadId.current = currentLoad;

      if (!userId) {
        setGroups([]);
        setMembership(EMPTY_MEMBERSHIP);
        setLoading(false);

        return;
      }

      if (!silent) {
        setLoading(true);
      }

      const { data, error: readError } =
        userRole === 'tutor'
          ? await service.getTutorSnapshot(userId)
          : await service.getStudentSnapshot(userId);

      if (loadId.current !== currentLoad) {
        return;
      }

      if (readError || !data) {
        setError(readError);
        setLoading(false);

        return;
      }

      setGroups(data.groups);
      setMembership(data.membership);
      setError(null);
      setLoading(false);
    },
    [service, userId, userRole]
  );

  const refresh = useCallback((): Promise<void> => runLoad(false), [runLoad]);

  /** La recarga que provoca un cambio ajeno: actualiza sin hacer parpadear. */
  const refreshSilently = useCallback((): Promise<void> => runLoad(true), [runLoad]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /*
   * Nunca antes de tener `userId`: un canal abierto con la clave anónima pasa la
   * autorización con las manos vacías y no se reintenta solo cuando después
   * llega la sesión, así que quedaría mudo para siempre.
   */
  useEffect(() => {
    if (!userId) {
      return;
    }

    return service.subscribeToClassrooms(userId, () => {
      void refreshSilently();
    });
  }, [refreshSilently, service, userId]);

  /** Ejecuta una escritura y recarga si salió bien. */
  const runWrite = useCallback(
    async (write: () => Promise<{ error: AppError | null }>): Promise<void> => {
      const { error: writeError } = await write();

      if (writeError) {
        setError(writeError);

        return;
      }

      setError(null);
      await refresh();
    },
    [refresh]
  );

  const createGroup = useCallback(
    async (input: CreateGroupInput): Promise<ClassGroup | null> => {
      if (!userId) {
        return null;
      }

      const { data, error: writeError } = await service.createGroup(input, userId);

      if (writeError || !data) {
        setError(writeError);

        return null;
      }

      setError(null);
      await refresh();

      return data;
    },
    [refresh, service, userId]
  );

  const deleteGroup = useCallback(
    async (groupId: string): Promise<void> => runWrite(() => service.deleteGroup(groupId)),
    [runWrite, service]
  );

  const removeStudent = useCallback(
    async (groupId: string, studentId: string): Promise<void> =>
      runWrite(() => service.removeStudent(groupId, studentId)),
    [runWrite, service]
  );

  const acceptRequest = useCallback(
    async (_groupId: string, requestId: string): Promise<void> =>
      runWrite(() => service.acceptRequest(requestId)),
    [runWrite, service]
  );

  const rejectRequest = useCallback(
    async (_groupId: string, requestId: string): Promise<void> =>
      runWrite(() => service.rejectRequest(requestId)),
    [runWrite, service]
  );

  /*
   * La guarda de «un alumno, un salón». Antes la sostenía el enrutado de la
   * vista, que sólo monta el buscador sin salón; contra la base, saltársela
   * devuelve un 42501 crudo en vez de no ofrecer el botón.
   */
  const requestJoin = useCallback(
    async (groupId: string): Promise<void> => {
      if (!userId || membership.status !== 'none') {
        return;
      }

      await runWrite(() => service.requestJoin(groupId, userId));
    },
    [membership.status, runWrite, service, userId]
  );

  /*
   * SIN la guarda que sí lleva `requestJoin`, y es deliberado. Aquélla existe
   * porque saltársela devuelve un 42501 crudo; aquí el servidor responde 23505 y
   * el servicio lo traduce a un motivo que el niño entiende, así que adelantarse
   * sólo escondería la razón. Quien mira decide qué enseñar ANTES de llamar.
   */
  const redeemInvitation = useCallback(
    async (token: string): Promise<boolean> => {
      const { error: writeError } = await service.redeemInvitation(token);

      if (writeError) {
        setError(writeError);

        return false;
      }

      setError(null);
      await refresh();

      return true;
    },
    [refresh, service]
  );

  const cancelJoinRequest = useCallback(async (): Promise<void> => {
    if (!userId) {
      return;
    }

    await runWrite(() => service.cancelJoinRequest(userId));
  }, [runWrite, service, userId]);

  const leaveGroup = useCallback(async (): Promise<void> => {
    if (!userId) {
      return;
    }

    await runWrite(() => service.leaveGroup(userId));
  }, [runWrite, service, userId]);

  const currentGroup = useMemo(
    () => groups.find((group) => group.id === membership.groupId) ?? null,
    [groups, membership.groupId]
  );

  const value = useMemo<ClassroomsContextValue>(
    () => ({
      acceptRequest,
      cancelJoinRequest,
      createGroup,
      currentGroup,
      deleteGroup,
      error,
      groups,
      leaveGroup,
      loading,
      membership,
      redeemInvitation,
      rejectRequest,
      removeStudent,
      requestJoin,
    }),
    [
      acceptRequest,
      cancelJoinRequest,
      createGroup,
      currentGroup,
      deleteGroup,
      error,
      groups,
      leaveGroup,
      loading,
      membership,
      redeemInvitation,
      rejectRequest,
      removeStudent,
      requestJoin,
    ]
  );

  return <ClassroomsContext.Provider value={value}>{children}</ClassroomsContext.Provider>;
};
