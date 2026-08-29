import type { AuthContextValue } from '../context/AuthContext';
import type { User } from '../types/user.types';

/**
 * Doble del contexto de auth para los tests que sólo necesitan un usuario.
 *
 * Vive aparte porque lo usan el helper de salones y los tests de enrutado, y
 * porque es lo que se rompe cada vez que `AuthContextValue` gana una acción: con
 * dos copias, `tsc` señala una, se arregla, y la otra aparece en la compilación
 * siguiente. Con una, se arregla aquí y se acabó.
 */
export const buildAuthValue = (user: User | null): AuthContextValue => ({
  changePassword: async () => false,
  clearError: () => undefined,
  error: null,
  loading: false,
  requestPasswordReset: async () => false,
  session: null,
  signIn: async () => false,
  signInWithGoogle: async () => false,
  signOut: async () => false,
  signUp: async () => 'error' as const,
  updatePassword: async () => false,
  updateRole: async () => ({ status: 'error' as const }),
  user,
});
