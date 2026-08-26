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

/** Credenciales de la cuenta de prueba de un rol, si están configuradas. */
export interface DevCredentials {
  email: string;
  password: string;
}

/**
 * Cuentas de prueba del acceso sin login. Devuelve `null` si falta cualquiera
 * de las dos variables, y entonces se cae en la marca de invitado: quien clone
 * el repositorio sin configurarlas tiene que poder entrar igual.
 *
 * Las variables se leen aquí y no en `config/env.ts` a propósito. Ese módulo
 * valida al importarse y se ejecuta también en producción, así que declararlas
 * allí metería correo y contraseña en el paquete publicado. Aquí la lectura
 * cuelga de `import.meta.env.DEV`, y los accesos son de miembro —nunca una
 * copia de `import.meta.env`, que en el build se sustituye entero—.
 */
export const getDevCredentials = (role: UserRole): DevCredentials | null => {
  if (!import.meta.env.DEV) {
    return null;
  }

  const email =
    role === 'tutor'
      ? import.meta.env.VITE_DEV_TUTOR_EMAIL
      : import.meta.env.VITE_DEV_CHILD_EMAIL;
  const password =
    role === 'tutor'
      ? import.meta.env.VITE_DEV_TUTOR_PASSWORD
      : import.meta.env.VITE_DEV_CHILD_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return { email, password };
};
