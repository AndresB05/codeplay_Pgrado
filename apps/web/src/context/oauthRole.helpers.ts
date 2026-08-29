import type { UserRole } from '../types/user.types';

/**
 * Rol elegido en el registro que tiene que sobrevivir el viaje al proveedor de
 * OAuth. `signInWithOAuth` no admite metadatos, así que el rol no puede viajar
 * con el alta y viaja por aquí: la ida y la vuelta son el mismo origen.
 *
 * Centraliza su clave como hace `guest.helpers.ts`, porque ningún componente
 * toca `localStorage` directamente.
 */
const PENDING_SIGNUP_ROLE_KEY = 'auth:pendingSignupRole';

const isBrowser = (): boolean => typeof window !== 'undefined';

export const savePendingSignupRole = (role: UserRole): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(PENDING_SIGNUP_ROLE_KEY, role);
};

export const clearPendingSignupRole = (): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(PENDING_SIGNUP_ROLE_KEY);
};

/**
 * Lee la intención y la borra en la misma llamada.
 *
 * No son dos funciones a propósito: con `get` y `clear` separados, cualquier
 * camino que devuelva antes de llamar a la segunda deja una intención viva que
 * se aplicaría al viaje SIGUIENTE, y en un computador de aula ese viaje puede
 * ser el de otra persona. Con una sola llamada eso no se puede olvidar.
 */
export const takePendingSignupRole = (): UserRole | null => {
  if (!isBrowser()) {
    return null;
  }

  const storedRole = window.localStorage.getItem(PENDING_SIGNUP_ROLE_KEY);

  clearPendingSignupRole();

  if (storedRole !== 'child' && storedRole !== 'tutor') {
    return null;
  }

  return storedRole;
};
