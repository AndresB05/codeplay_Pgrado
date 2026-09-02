/**
 * Token del enlace de invitación que tiene que sobrevivir el rodeo del registro.
 *
 * Quien abre un enlace normalmente **no tiene cuenta** —el tutor se lo pasa a
 * una familia nueva—, así que entre abrirlo y canjearlo hay un registro entero
 * por medio, y con Google ese rodeo sale de la aplicación. El token viaja por
 * aquí y se recupera al volver.
 *
 * Centraliza su clave como hacen `guest.helpers.ts` y `oauthRole.helpers.ts`,
 * porque ningún componente toca `localStorage` directamente.
 */
const PENDING_INVITATION_TOKEN_KEY = 'classrooms:pendingInvitationToken';

const isBrowser = (): boolean => typeof window !== 'undefined';

export const savePendingInvitationToken = (token: string): void => {
  if (!isBrowser() || !token) {
    return;
  }

  window.localStorage.setItem(PENDING_INVITATION_TOKEN_KEY, token);
};

export const clearPendingInvitationToken = (): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(PENDING_INVITATION_TOKEN_KEY);
};

/**
 * Lee el token SIN borrarlo, para quien sólo necesita saber a dónde mandar a
 * alguien.
 *
 * Se llama `peek` y no `take` a propósito: el sitio de llamada tiene que decir
 * cuál de las dos es, para que nadie «arregle» ésta creyendo que le falta el
 * borrado. Existe porque `PublicRoute` decide el destino **durante el render**,
 * y borrar ahí es una escritura en un camino que React invoca dos veces bajo
 * StrictMode: medido, la primera pasada consumía el token y la segunda ya no lo
 * encontraba, así que el token se gastaba Y la persona acababa en su panel.
 *
 * Que exista una lectura sin borrado NO reabre lo que el patrón de
 * `oauthRole.helpers.ts` prohíbe. Allí lo peligroso es repartir el `get` y el
 * `clear` entre caminos que pueden volver antes de llegar al segundo. Aquí el
 * borrado tiene **un dueño único**, `pages/Invite`, que además es **el único
 * destino al que este token puede llevar**: no hay camino que se lo salte.
 */
export const peekPendingInvitationToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(PENDING_INVITATION_TOKEN_KEY) || null;
};

/**
 * Lee el token y lo borra en la misma llamada. La usa `pages/Invite` al llegar.
 *
 * No son dos funciones a propósito, y aquí importa más que en
 * `oauthRole.helpers.ts`, de donde viene el patrón: con `get` y `clear`
 * separados, cualquier camino que devuelva antes de llamar a la segunda deja un
 * token vivo que se aplicaría al viaje SIGUIENTE. Con un rol eso ascendía a
 * alguien por error; con una invitación **metería al niño siguiente del
 * computador del aula en un salón ajeno**.
 *
 * Borra SIEMPRE lo que hubiera, coincida o no con el token que se está abriendo:
 * quien llega con un enlace nuevo puede arrastrar el de un rodeo que abandonó, y
 * un borrado condicional al que coincide dejaría vivo el viejo.
 */
export const takePendingInvitationToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }

  const storedToken = window.localStorage.getItem(PENDING_INVITATION_TOKEN_KEY);

  clearPendingInvitationToken();

  return storedToken || null;
};
