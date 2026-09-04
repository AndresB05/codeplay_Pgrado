export const ROUTES = {
  HOME: '/',
  LANDING: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  AUTH_CALLBACK: '/auth/callback',
  INVITE: '/invite',
  SIGNUP_CHILD: '/signup/child',
  SIGNUP_TUTOR: '/signup/tutor',
  DASHBOARD: '/dashboard',
  WORLDS: '/dashboard/worlds',
  TROPHY_ROOM: '/dashboard/trophies',
  CLASSROOM: '/dashboard/classroom',
  SETTINGS: '/dashboard/settings',
  /*
   * NO cuelga de WORLDS: `Dashboard.tsx` colapsa cualquier ruta bajo
   * `${WORLDS}/` en WORLDS antes del `switch`, así que ahí debajo esta pantalla
   * no llegaría nunca a su caso y saldría la de mundos, sin error que lo delate.
   */
  GAME_LAB: '/dashboard/game',
  TEACHER: '/teacher',
  TEACHER_GROUPS: '/teacher/groups',
  TEACHER_PANEL: '/teacher/panel',
  TEACHER_SETTINGS: '/teacher/settings',
} as const;
