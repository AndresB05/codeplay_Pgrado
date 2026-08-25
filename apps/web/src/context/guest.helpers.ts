import type { UserRole } from '../types/user.types';

/**
 * Sesión de invitado para desarrollo: permite entrar al dashboard sin login
 * mientras la autenticación real no está conectada. Centraliza las claves de
 * localStorage para que no queden repartidas por los componentes.
 */
const GUEST_FLAG_KEY = 'dev:skipAuth';
const GUEST_ROLE_KEY = 'dev:guestRole';

const isBrowser = (): boolean => typeof window !== 'undefined';

const isGuestModeAvailable = (): boolean => import.meta.env.DEV && isBrowser();

export const isGuestSession = (): boolean => {
  if (!isGuestModeAvailable()) {
    return false;
  }

  return window.localStorage.getItem(GUEST_FLAG_KEY) === '1';
};

export const getGuestRole = (): UserRole | null => {
  if (!isGuestSession()) {
    return null;
  }

  const storedRole = window.localStorage.getItem(GUEST_ROLE_KEY);

  return storedRole === 'tutor' ? 'tutor' : 'child';
};

export const startGuestSession = (role: UserRole): void => {
  if (!isGuestModeAvailable()) {
    return;
  }

  window.localStorage.setItem(GUEST_FLAG_KEY, '1');
  window.localStorage.setItem(GUEST_ROLE_KEY, role);
};

export const endGuestSession = (): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(GUEST_FLAG_KEY);
  window.localStorage.removeItem(GUEST_ROLE_KEY);
};
