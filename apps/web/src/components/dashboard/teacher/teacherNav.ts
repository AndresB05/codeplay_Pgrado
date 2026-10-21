import { ROUTES } from '../../../constants/routes';
import { ChartIcon, GraduationIcon, SettingsIcon } from './TeacherIcons';

/*
 * Los módulos del tutor: los mismos en la barra lateral y en la inferior del
 * móvil. `shortLabel` es el rótulo de la inferior, donde el largo no cabe en un
 * tercio de pantalla; el largo sigue siendo su nombre accesible.
 */
export const teacherNavItems = (activeSection: string, activeGroupId: string | null) => [
  {
    route: ROUTES.TEACHER_GROUPS,
    label: 'Salón de clases',
    shortLabel: 'Salones',
    icon: GraduationIcon,
    active: activeSection === ROUTES.TEACHER_GROUPS && activeGroupId === null,
  },
  {
    route: ROUTES.TEACHER_PANEL,
    label: 'Panel de información',
    shortLabel: 'Información',
    icon: ChartIcon,
    active: activeSection === ROUTES.TEACHER_PANEL,
  },
  {
    route: ROUTES.TEACHER_SETTINGS,
    label: 'Ajustes de cuenta',
    shortLabel: 'Ajustes',
    icon: SettingsIcon,
    active: activeSection === ROUTES.TEACHER_SETTINGS,
  },
];

export const pendingRequestsLabel = (total: number) =>
  `${total} ${total === 1 ? 'solicitud' : 'solicitudes'} en espera`;
