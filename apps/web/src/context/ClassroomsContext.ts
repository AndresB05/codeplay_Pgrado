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
  /**
   * Vuelve a leer sin declarar espera, para cuando quien mira vuelve a mirar: al
   * abrirse una pantalla o al recuperar la ventana el foco.
   *
   * Hace falta porque la suscripción en vivo no alcanza a todo lo que esas
   * pantallas enseñan. Desde el paso 17 el panel del tutor cuenta progreso, y
   * `user_progress` no puede publicarse: Realtime entrega un cambio a quien la
   * política de esa tabla deja leer la fila, y la suya sólo alcanza a su dueño
   * —medido el 18-sep-2026—, así que el tutor no recibiría el aviso.
   *
   * Se expone el camino silencioso y no `refresh`: una pantalla que se abre
   * sobre datos ya cargados no debe blanquearse mientras comprueba si cambiaron.
   */
  refreshSilently: () => Promise<void>;

  // Acciones del tutor
  /** Devuelve el salón creado, o `null` si la base lo rechazó. */
  createGroup: (input: CreateGroupInput) => Promise<ClassGroup | null>;
  /** Borra el salón; sus alumnos quedan sin salón. */
  deleteGroup: (groupId: string) => Promise<void>;
  removeStudent: (groupId: string, studentId: string) => Promise<void>;
  acceptRequest: (groupId: string, requestId: string) => Promise<void>;
  rejectRequest: (groupId: string, requestId: string) => Promise<void>;

  // Acciones del niño
  requestJoin: (groupId: string) => Promise<void>;
  /**
   * Entra al salón con el token de un enlace de invitación. Devuelve si entró,
   * porque la pantalla del enlace navega sólo cuando sí.
   *
   * Vive en el store y no en un hook aparte —al revés que generar y listar
   * enlaces, que son cosa del tutor— porque su efecto **es** la pertenencia, que
   * es el estado que este store posee. Fuera de aquí, la pantalla del niño se
   * quedaría con la `membership` vieja hasta que llegara el evento de Realtime.
   */
  redeemInvitation: (token: string) => Promise<boolean>;
  cancelJoinRequest: () => Promise<void>;
  leaveGroup: () => Promise<void>;
}

export const ClassroomsContext = createContext<ClassroomsContextValue | undefined>(undefined);
