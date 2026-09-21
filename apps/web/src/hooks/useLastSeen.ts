import { useEffect } from 'react';
import { profileService } from '../services/profile.service';

/*
 * Mientras la página sigue abierta la «última actividad» no debe envejecer: el
 * tutor ve «En línea» por la presencia, pero en cuanto el niño cierra, la tabla
 * cae en esta fecha.
 */
const HEARTBEAT_MS = 5 * 60 * 1000;

/**
 * Cuenta como actividad entrar a la página, volver a la pestaña y seguir en
 * ella, no sólo jugar. Un fallo se descarta: es un dato de seguimiento, y
 * avisarle al niño de que no se pudo anotar su visita no le serviría de nada.
 */
export const useLastSeen = (userId: string | null): void => {
  useEffect(() => {
    if (!userId) {
      return;
    }

    const touch = (): void => {
      if (document.visibilityState === 'visible') {
        void profileService.touchLastSeen();
      }
    };

    touch();

    const timer = window.setInterval(touch, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', touch);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', touch);
    };
  }, [userId]);
};
