/**
 * Si la barra lateral quedó plegada. Es una comodidad de este navegador y no
 * un dato de la cuenta: por eso vive aquí y no en el perfil.
 *
 * Todo va en `try`: con los datos del sitio bloqueados `localStorage` lanza, y
 * perder la preferencia no puede tumbar el panel.
 */
const SIDEBAR_COLLAPSED_KEY = 'dashboard:sidebarCollapsed';

export const readSidebarCollapsed = (): boolean => {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

export const saveSidebarCollapsed = (collapsed: boolean): void => {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    /* Sin almacenamiento la barra sigue funcionando; sólo no se recuerda. */
  }
};
