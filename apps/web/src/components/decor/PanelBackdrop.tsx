/*
 * Va DENTRO de `<main>` y no en la página: así se centra en la zona de
 * contenido, con la barra lateral plegada o no. La caja absoluta mide lo que
 * `<main>` sin ocupar sitio en el flujo, y la imagen se queda pegada arriba
 * mientras el contenido corre por encima. `overflow-clip` corta lo que sobra
 * cuando el contenido es más corto que la pantalla, sin volverse contenedor de
 * scroll, que despegaría la imagen.
 */
export const PanelBackdrop = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-clip">
    <div className="panel-backdrop sticky top-0 h-screen" />
  </div>
);
