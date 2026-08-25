import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  buildGroup,
  buildInitials,
  buildSeedGroups,
  buildStudentFromRequest,
  pickAvatarTone,
} from '../components/dashboard/teacher/classroomsData';
import { useAuth } from '../hooks/useAuth';
import type { ClassGroup, CreateGroupInput, StudentMembership } from '../types/classroom.types';
import { ClassroomsContext } from './ClassroomsContext';
import type { ClassroomsContextValue } from './ClassroomsContext';

/**
 * Store de salones del prototipo. Mantiene en `localStorage` lo que más
 * adelante vivirá en Supabase, para que la solicitud que envía el niño siga
 * ahí cuando se entra como tutor y al recargar la página.
 *
 * Las mutaciones se calculan fuera de los actualizadores de estado: React
 * invoca esos actualizadores dos veces en StrictMode, y aquí se generan ids y
 * marcas de tiempo que no deben salir distintas en cada invocación.
 */
const STORAGE_KEY = 'codeplay:classrooms';
const STORAGE_VERSION = 1;

/** Identidad del niño de la sesión mientras no hay login real. */
const CURRENT_STUDENT_ID = 'guest-child';
const FALLBACK_STUDENT_NAME = 'Explorer Leo';

interface PersistedState {
  version: number;
  groups: ClassGroup[];
  membership: StudentMembership;
}

const EMPTY_MEMBERSHIP: StudentMembership = { status: 'none', groupId: null };

const readPersistedState = (): PersistedState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedState;

    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.groups)) {
      return null;
    }

    return parsed;
  } catch {
    // Estado corrupto o de una versión anterior: se descarta y se resiembra.
    return null;
  }
};

interface ClassroomsProviderProps {
  children: ReactNode;
}

export const ClassroomsProvider = ({ children }: ClassroomsProviderProps) => {
  const { user } = useAuth();

  const [groups, setGroups] = useState<ClassGroup[]>(
    () => readPersistedState()?.groups ?? buildSeedGroups()
  );
  const [membership, setMembership] = useState<StudentMembership>(
    () => readPersistedState()?.membership ?? EMPTY_MEMBERSHIP
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const payload: PersistedState = { version: STORAGE_VERSION, groups, membership };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [groups, membership]);

  const studentName = user?.fullName || FALLBACK_STUDENT_NAME;

  const createGroup = useCallback(
    (input: CreateGroupInput): ClassGroup => {
      const created = buildGroup(input, groups);

      setGroups((current) => [...current, created]);

      return created;
    },
    [groups]
  );

  /**
   * Borra el salón entero. Sus alumnos dejan de pertenecer a ningún salón: si
   * el niño de esta sesión era uno de ellos (o tenía una solicitud pendiente),
   * vuelve al buscador de salones.
   */
  const deleteGroup = useCallback(
    (groupId: string): void => {
      setGroups((current) => current.filter((group) => group.id !== groupId));

      if (membership.groupId === groupId) {
        setMembership(EMPTY_MEMBERSHIP);
      }
    },
    [membership.groupId]
  );

  const removeStudent = useCallback((groupId: string, studentId: string): void => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, students: group.students.filter((student) => student.id !== studentId) }
          : group
      )
    );

    if (studentId === CURRENT_STUDENT_ID) {
      setMembership(EMPTY_MEMBERSHIP);
    }
  }, []);

  const acceptRequest = useCallback(
    (groupId: string, requestId: string): void => {
      const group = groups.find((item) => item.id === groupId);
      const request = group?.pendingRequests.find((item) => item.id === requestId);

      if (!group || !request) {
        return;
      }

      const student = buildStudentFromRequest(request);

      setGroups((current) =>
        current.map((item) =>
          item.id === groupId
            ? {
                ...item,
                students: [...item.students, student],
                pendingRequests: item.pendingRequests.filter((entry) => entry.id !== requestId),
              }
            : item
        )
      );

      if (request.studentId === CURRENT_STUDENT_ID) {
        setMembership({ status: 'member', groupId });
      }
    },
    [groups]
  );

  const rejectRequest = useCallback(
    (groupId: string, requestId: string): void => {
      const request = groups
        .find((item) => item.id === groupId)
        ?.pendingRequests.find((item) => item.id === requestId);

      setGroups((current) =>
        current.map((item) =>
          item.id === groupId
            ? {
                ...item,
                pendingRequests: item.pendingRequests.filter((entry) => entry.id !== requestId),
              }
            : item
        )
      );

      if (request?.studentId === CURRENT_STUDENT_ID) {
        setMembership(EMPTY_MEMBERSHIP);
      }
    },
    [groups]
  );

  const inviteByEmail = useCallback((groupId: string, email: string): void => {
    const invitation = {
      id: `inv-${Date.now().toString(36)}`,
      email: email.trim().toLowerCase(),
      sentAtIso: new Date().toISOString(),
      status: 'pending' as const,
    };

    setGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, invitations: [...group.invitations, invitation] } : group
      )
    );
  }, []);

  const requestJoin = useCallback(
    (groupId: string): void => {
      const request = {
        id: `req-${Date.now().toString(36)}`,
        studentId: CURRENT_STUDENT_ID,
        studentName,
        initials: buildInitials(studentName),
        avatarTone: pickAvatarTone(CURRENT_STUDENT_ID),
        requestedAtIso: new Date().toISOString(),
      };

      setGroups((current) =>
        current.map((group) =>
          group.id === groupId
            ? { ...group, pendingRequests: [...group.pendingRequests, request] }
            : group
        )
      );

      setMembership({ status: 'pending', groupId });
    },
    [studentName]
  );

  const cancelJoinRequest = useCallback((): void => {
    setGroups((current) =>
      current.map((group) => ({
        ...group,
        pendingRequests: group.pendingRequests.filter(
          (request) => request.studentId !== CURRENT_STUDENT_ID
        ),
      }))
    );

    setMembership(EMPTY_MEMBERSHIP);
  }, []);

  const leaveGroup = useCallback((): void => {
    setGroups((current) =>
      current.map((group) => ({
        ...group,
        students: group.students.filter((student) => student.id !== CURRENT_STUDENT_ID),
      }))
    );

    setMembership(EMPTY_MEMBERSHIP);
  }, []);

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
      groups,
      inviteByEmail,
      leaveGroup,
      membership,
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
      groups,
      inviteByEmail,
      leaveGroup,
      membership,
      rejectRequest,
      removeStudent,
      requestJoin,
    ]
  );

  return <ClassroomsContext.Provider value={value}>{children}</ClassroomsContext.Provider>;
};
