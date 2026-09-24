/*
 * Va DENTRO de `<main>` y no en la página: así se centra en la zona de
 * contenido, con la barra lateral plegada o no. La caja absoluta mide lo que
 * `<main>` sin ocupar sitio en el flujo, y la imagen se queda pegada arriba
 * mientras el contenido corre por encima. `overflow-clip` corta lo que sobra
 * cuando el contenido es más corto que la pantalla, sin volverse contenedor de
 * scroll, que despegaría la imagen.
 *
 * La madera no se queda pegada: una pared de tablas quieta mientras las tablas
 * de encima se mueven se ve falsa. Ocupa todo el alto de `<main>` y corre con
 * el contenido.
 *
 * `underSidebar` lo estira 16 px a la izquierda, por debajo del tronco de la
 * barra del niño: donde el contorno del tronco se mete hacia dentro, sin eso se
 * veía una rendija con el fondo de la página. La barra del tutor no lo lleva,
 * porque es blanca y el fondo le taparía el borde.
 */
export const PanelBackdrop = ({
  surface = 'valley',
  underSidebar = false,
}: {
  surface?: 'valley' | 'wood';
  underSidebar?: boolean;
}) => (
  <div
    aria-hidden
    className={`pointer-events-none absolute inset-y-0 right-0 -z-10 overflow-clip ${
      underSidebar ? '-left-4' : 'left-0'
    }`}
  >
    <div
      className={
        surface === 'wood' ? 'trophy-backdrop h-full' : 'panel-backdrop sticky top-0 h-screen'
      }
    />
  </div>
);
