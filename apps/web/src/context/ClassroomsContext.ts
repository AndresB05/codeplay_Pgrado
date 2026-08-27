import { createContext } from 'react';
import type { AppError } from '../errors/AppError';
import type { ClassGroup, CreateGroupInput, StudentMembership } from '../types/classroom.types';

export interface ClassroomsContextValue {
  groups: ClassGroup[];
  /** Situación del niño de la sesión actual: sin salón, en espera o inscrito. */
  membership: StudentMembership;
  /** Salón al que pertenece o al que solicitó entrar el niño actual. */
  currentGroup: ClassGroup | null;
  /** Cierto mientras los salones se están consultando. */
  loading: boolean;
  /** Último error de lectura o de escritura, para no descartarlo en silencio. */
  error: AppError | null;

  // Acciones del tutor
  /** Devuelve el salón creado, o `null` si la base lo rechazó. */
  createGroup: (input: CreateGroupInput) => Promise<ClassGroup | null>;
  /** Borra el salón; sus alumnos quedan sin salón. */
  deleteGroup: (groupId: string) => Promise<void>;
  removeStudent: (groupId: string, studentId: string) => Promise<void>;
  acceptRequest: (groupId: string, requestId: string) => Promise<void>;
  rejectRequest: (groupId: string, requestId: string) => Promise<void>;
  inviteByEmail: (groupId: string, email: string) => Promise<void>;

  // Acciones del niño
  requestJoin: (groupId: string) => Promise<void>;
  cancelJoinRequest: () => Promise<void>;
  leaveGroup: () => Promise<void>;
}

export const ClassroomsContext = createContext<ClassroomsContextValue | undefined>(undefined);
