import * as Blockly from 'blockly/core';

/*
 * EL LIENZO NO TIENE SITIO POR ENCIMA DE SUS BLOQUES. De fábrica Blockly deja
 * media vista de margen por arriba —y una entera con el lienzo vacío—, así que
 * con la vista en el origen la barra no está al tope: aparecía a media altura, o
 * abajo del todo, como si hubiera algo encima. Los bloques se encadenan hacia
 * abajo, así que el margen sólo hace falta por debajo.
 */
export class TopAnchoredMetrics extends Blockly.MetricsManager {
  protected override getPaddedContent_(
    viewMetrics: Blockly.MetricsManager.ContainerRegion,
    contentMetrics: Blockly.MetricsManager.ContainerRegion
  ) {
    const padded = super.getPaddedContent_(viewMetrics, contentMetrics);
    const top = Math.min(contentMetrics.top, 0);

    /*
     * La vista actual cabe SIEMPRE en el área. Con el área de un alto de vista
     * justo, un bloque soltado asomando por arriba subía el tope y Blockly
     * arrastraba la vista con él: el lienzo se movía al soltar, y en el móvil el
     * niño perdía el bloque de vista.
     */
    const bottom = Math.max(
      padded.bottom,
      top + viewMetrics.height,
      viewMetrics.top + viewMetrics.height
    );

    return { ...padded, top, bottom };
  }
}
