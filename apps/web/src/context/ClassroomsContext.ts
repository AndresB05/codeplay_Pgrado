import { createContext } from 'react';
import type { ClassGroup, CreateGroupInput, StudentMembership } from '../types/classroom.types';

export interface ClassroomsContextValue {
  groups: ClassGroup[];
  /** Situación del niño de la sesión actual: sin salón, en espera o inscrito. */
  membership: StudentMembership;
  /** Salón al que pertenece o al que solicitó entrar el niño actual. */
  currentGroup: ClassGroup | null;

  // Acciones del tutor
  createGroup: (input: CreateGroupInput) => ClassGroup;
  /** Borra el salón; sus alumnos quedan sin salón. */
  deleteGroup: (groupId: string) => void;
  removeStudent: (groupId: string, studentId: string) => void;
  acceptRequest: (groupId: string, requestId: string) => void;
  rejectRequest: (groupId: string, requestId: string) => void;
  inviteByEmail: (groupId: string, email: string) => void;

  // Acciones del niño
  requestJoin: (groupId: string) => void;
  cancelJoinRequest: () => void;
  leaveGroup: () => void;
}

export const ClassroomsContext = createContext<ClassroomsContextValue | undefined>(undefined);
