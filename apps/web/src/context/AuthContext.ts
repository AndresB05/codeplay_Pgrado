import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AppError } from '../errors/AppError';
import type { User, UserRole } from '../types/user.types';

/**
 * Los cuatro finales de un registro. Un booleano no distingue los de en medio, y
 * darlos por buenos es lo que dejaba al usuario en `/login` sin explicación.
 *
 * `already-exists` es el correo que ya tiene cuenta: no se creó nada, no se abrió
 * sesión, y el aviso que lo acompañe no nombra el rol de esa cuenta.
 */
export type SignUpOutcome =
  | 'signed-in'
  | 'confirmation-required'
  | 'already-exists'
  | 'error';

/**
 * Los tres finales de fijar el rol. `locked` es el que no se puede confundir con
 * los otros dos: la sesión es válida y la persona está dentro; lo único que no
 * ocurrió es un cambio que no debía ocurrir.
 */
export type UpdateRoleResult =
  | { status: 'updated'; user: User }
  | { status: 'locked' }
  | { status: 'error' };

export interface AuthContextValue {
  /** Cambia la contraseña verificando antes la actual. Ajustes, con sesión. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  clearError: () => void;
  error: AppError | null;
  loading: boolean;
  requestPasswordReset: (email: string) => Promise<boolean>;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  /**
   * Con rol guarda la intención para aplicarla a la vuelta —es el registro—; sin
   * rol la borra, porque quien entra por la pantalla de acceso ya tiene cuenta y
   * una intención vieja no debe alcanzarle.
   */
  signInWithGoogle: (role?: UserRole) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ) => Promise<SignUpOutcome>;
  /**
   * Cambia el nombre del perfil. Ajustes, con sesión.
   *
   * Vive aquí y no en `useProfile()` —que ya sabe escribir el perfil— porque el
   * nombre se lee de ESTE provider en siete sitios, y `useProfile` mantiene su
   * propia copia: escribir por ahí lo cambiaría en la base y dejaría el viejo en
   * pantalla hasta recargar. El provider hace `setUser` con lo que devuelve la
   * RPC, como en `updateRole`, y así los siete se refrescan solos.
   *
   * Basta un booleano, a diferencia de `updateRole`: aquí nadie navega con el
   * perfil devuelto.
   */
  updateFullName: (fullName: string) => Promise<boolean>;
  /** Fija la contraseña sin pedir la anterior. Pantalla del enlace del correo. */
  updatePassword: (newPassword: string) => Promise<boolean>;
  /**
   * Fija el rol del perfil contra el servidor. Pantalla de vuelta del proveedor.
   *
   * Devuelve el perfil que escribió el servidor, y no un booleano, porque quien
   * llama tiene que navegar con ESE rol y no con el que pidió: el invariante de
   * `useRoleHomeRedirect` es que el rol con el que se navega lo decide el
   * servidor. Con un booleano, el único dato a mano era el que se envió.
   *
   * Y distingue `locked` del resto porque **no es un fallo**: la cuenta ya
   * existía y su rol se queda como estaba. El motivo viaja en el resultado y no
   * en el `error` del contexto porque quien llama lo lee justo al resolverse el
   * `await`, cuando ese estado todavía no se ha propagado.
   */
  updateRole: (role: UserRole) => Promise<UpdateRoleResult>;
  user: User | null;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
