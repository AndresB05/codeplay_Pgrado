/*
 * El acceso «Sin login» y el Laboratorio 3D, apagados para la prueba con
 * usuarios: quien entra por ahí por error ve un estado que no es el de su cuenta
 * y lo reporta como fallo. No se borran porque se necesitan después; se
 * encienden en desarrollo con `VITE_ENABLE_DEV_TOOLS=true` en `apps/web/.env`.
 */
export const DEV_TOOLS_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';
