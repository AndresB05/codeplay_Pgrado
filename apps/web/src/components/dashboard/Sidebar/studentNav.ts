import { ROUTES } from '../../../constants/routes';
import { DEV_TOOLS_ENABLED } from '../../../config/devTools';
import { CompassIcon, CubeIcon, GraduationIcon, TrophyIcon } from './StudentNavIcons';

/* Los módulos del niño: los mismos en la barra lateral y en la inferior del móvil. */
export const STUDENT_NAV_ITEMS = [
  { route: ROUTES.WORLDS, label: 'Mundos', icon: CompassIcon },
  { route: ROUTES.TROPHY_ROOM, label: 'Sala de Trofeos', icon: TrophyIcon },
  { route: ROUTES.CLASSROOM, label: 'Salón de clases', icon: GraduationIcon },
  /*
   * El banco de pruebas del juego. Sólo en desarrollo, como el botón «Sin
   * login»: en producción su ruta ni siquiera se registra, así que un enlace
   * aquí llevaría al comodín del router.
   */
  ...(DEV_TOOLS_ENABLED
    ? [{ route: ROUTES.GAME_LAB, label: 'Laboratorio 3D', icon: CubeIcon, dev: true }]
    : []),
];
