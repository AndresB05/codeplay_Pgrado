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
 */
export const PanelBackdrop = ({ surface = 'valley' }: { surface?: 'valley' | 'wood' }) => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-clip">
    <div
      className={
        surface === 'wood' ? 'trophy-backdrop h-full' : 'panel-backdrop sticky top-0 h-screen'
      }
    />
  </div>
);
