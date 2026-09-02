import type { Session } from '@supabase/supabase-js';
import type { AuthContextValue } from '../context/AuthContext';
import type { User } from '../types/user.types';

/**
 * Sesión mínima para los tests que necesitan que `isAuthenticated` sea cierta.
 * Sólo se compara contra `null`, así que no hace falta nada más dentro.
 */
export const FAKE_SESSION = {} as Session;

/**
 * Doble del contexto de auth para los tests que sólo necesitan un usuario.
 *
 * Vive aparte porque lo usan el helper de salones y los tests de enrutado, y
 * porque es lo que se rompe cada vez que `AuthContextValue` gana una acción: con
 * dos copias, `tsc` señala una, se arregla, y la otra aparece en la compilación
 * siguiente. Con una, se arregla aquí y se acabó.
 */
export const buildAuthValue = (
  user: User | null,
  session: Session | null = null
): AuthContextValue => ({
  changePassword: async () => false,
  clearError: () => undefined,
  error: null,
  loading: false,
  requestPasswordReset: async () => false,
  session,
  signIn: async () => false,
  signInWithGoogle: async () => false,
  signOut: async () => false,
  signUp: async () => 'error' as const,
  updateFullName: async () => false,
  updatePassword: async () => false,
  updateRole: async () => ({ status: 'error' as const }),
  user,
});
