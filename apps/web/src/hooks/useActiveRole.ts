import { getGuestRole } from '../context/guest.helpers';
import type { UserRole } from '../types/user.types';
import { useAuth } from './useAuth';

/**
 * Rol efectivo de la sesión actual. Prioriza el perfil autenticado y cae en el
 * rol de la sesión de invitado mientras el login no esté conectado.
 */
export const useActiveRole = (): UserRole | null => {
  const { user } = useAuth();

  return user?.role ?? getGuestRole();
};
