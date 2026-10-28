/*
 * En el servidor de la universidad la app no vive en la raíz sino en
 * `/~andres.blanco/`: un recurso de `public/` o un enlace absoluto escrito
 * desde `/` apuntaría a la portada de la facultad. Todo cuelga de la base del
 * build, que en Vercel y en desarrollo sigue siendo `/`.
 */
export const BASE_PATH = import.meta.env.BASE_URL;

export const withBase = (path: string): string => `${BASE_PATH}${path.replace(/^\//, '')}`;

export const absoluteUrl = (path: string): string =>
  new URL(withBase(path), window.location.origin).toString();
