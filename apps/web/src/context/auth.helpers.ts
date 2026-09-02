import type { Session } from '@supabase/supabase-js';
import { ROUTES } from '../constants/routes';
import { peekPendingInvitationToken } from './invitationToken.helpers';
import type { User, UserRole } from '../types/user.types';

export const getUserRole = (user: User | null): UserRole | null => {
  return user?.role ?? null;
};

export const isAuthenticated = (session: Session | null): boolean => {
  return session !== null;
};

export const isChild = (user: User | null): boolean => {
  return getUserRole(user) === 'child';
};

export const isTutor = (user: User | null): boolean => {
  return getUserRole(user) === 'tutor';
};

/** Panel al que pertenece cada rol: el niño juega, el profesor administra salones. */
export const getHomeRouteForRole = (role: UserRole | null): string => {
  return role === 'tutor' ? ROUTES.TEACHER_GROUPS : ROUTES.WORLDS;
};

/**
 * A dónde aterriza alguien que acaba de quedar autenticado.
 *
 * UNA implementación y TRES puntos de llamada —`PublicRoute`, `AuthCallback` y
 * `useRoleHomeRedirect`—, porque los tres deciden destino y hasta ahora
 * coincidían por casualidad: los tres calculaban `getHomeRouteForRole`, así que
 * daba igual quién ganara. En cuanto uno de ellos tuvo algo que decir que el
 * otro no sabía, la carrera dejó de ser inocua.
 *
 * Y la carrera **está medida, no supuesta**: `useActiveRole` devuelve
 * `user?.role`, así que el rol llega en el mismo render que el usuario y
 * `PublicRoute`, siendo el padre, devuelve `<Navigate>` antes de que el efecto
 * del hijo corra. El hook pierde SIEMPRE, no a veces. Con un resolutor único da
 * lo mismo: gane quien gane, el token se consume y el destino es el mismo.
 *
 * `useRoleHomeRedirect` sigue llamándolo aunque casi siempre pierda, porque
 * `/reset-password` va detrás de `PrivateRoute` y ahí `PublicRoute` no
 * interviene: sin esta llamada, quien abre el enlace del correo con una
 * invitación pendiente aterriza en su panel.
 *
 * ES PURA, Y TIENE QUE SERLO: `PublicRoute` la llama durante el render, que React
 * invoca dos veces bajo StrictMode. Por eso sólo mira el token y no lo borra —
 * consumirlo aquí lo gastaba en la primera pasada y mandaba al panel en la
 * segunda—. **Consume quien llega, no quien decide**: el borrado vive en
 * `pages/Invite`, el único destino al que este token puede llevar.
 */
export const resolveLandingRoute = (role: UserRole | null): string => {
  const pendingToken = peekPendingInvitationToken();

  return pendingToken ? `${ROUTES.INVITE}/${pendingToken}` : getHomeRouteForRole(role);
};
