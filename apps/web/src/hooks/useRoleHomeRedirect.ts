import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHomeRouteForRole } from '../context/auth.helpers';
import { useAuth } from './useAuth';

interface RoleHomeRedirect {
  /** Cierto mientras se espera el perfil, para desactivar los controles. */
  awaitingProfile: boolean;
  cancel: () => void;
  start: () => void;
}

/**
 * Lleva al panel del rol en cuanto llega el perfil.
 *
 * El rol lo decide el perfil que devuelve el servidor, no el formulario que se
 * rellenó ni el botón que se pulsó. Si una cuenta de tutor quedara con rol
 * `child`, navegar por lo elegido llevaría a un panel que `PrivateRoute`
 * rebotaría acto seguido; así el desajuste se ve en lugar de disimularse.
 *
 * Se espera en un efecto y no dentro del manejador del envío porque el perfil
 * llega en un render posterior: allí habría que adivinar el rol antes de
 * tenerlo, que es exactamente lo que hacía el destino fijo.
 */
export const useRoleHomeRedirect = (): RoleHomeRedirect => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [awaitingProfile, setAwaitingProfile] = useState(false);

  useEffect(() => {
    if (!awaitingProfile || !user) {
      return;
    }

    setAwaitingProfile(false);
    navigate(getHomeRouteForRole(user.role));
  }, [awaitingProfile, navigate, user]);

  const start = useCallback(() => {
    setAwaitingProfile(true);
  }, []);

  const cancel = useCallback(() => {
    setAwaitingProfile(false);
  }, []);

  return { awaitingProfile, cancel, start };
};
