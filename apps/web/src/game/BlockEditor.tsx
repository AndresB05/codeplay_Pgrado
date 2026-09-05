import * as Blockly from 'blockly/core';
import * as SpanishMessages from 'blockly/msg/es';
import { useEffect, useRef } from 'react';
import { TOOLBOX, defineGameBlocks } from './blocks';
import { sealProgram, type Program } from './program';

/*
 * El editor de bloques. Es el lado perezoso de su frontera: aquí se importa
 * Blockly, y por eso este archivo entra por el `import()` de
 * `BlockEditorLoader.tsx` y no de otra forma.
 *
 * La frontera es SUYA y no cuelga de la del motor 3D: `GameSceneLoader` aísla
 * `three`, y Blockly no es 3D. Colgarlo de ahí metería un componente de DOM
 * dentro de un árbol de @react-three/fiber, donde los elementos no son etiquetas
 * de HTML sino objetos de three.
 */

/*
 * El español no es sólo el texto de nuestros tres bloques —ése nace en español
 * en `blocks.ts`—: son las categorías, los menús contextuales («Duplicate»,
 * «Delete Block»), los diálogos y los avisos, que son de Blockly. Se cargan sus
 * traducciones en vez de traducir a mano lo que se ve, porque un editor a medio
 * traducir parece terminado y no lo está.
 *
 * Se filtran los textos en vez de pasar el módulo entero porque el envoltorio
 * ESM de Blockly reexporta además el paquete completo bajo `default`, que no es
 * un mensaje.
 */
const spanishMessages: Record<string, string> = Object.fromEntries(
  Object.entries(SpanishMessages).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  ),
);

interface BlockEditorProps {
  onProgramChange: (program: Program) => void;
}

export const BlockEditor = ({ onProgramChange }: BlockEditorProps) => {
  const container = useRef<HTMLDivElement>(null);

  /*
   * La llamada hacia arriba viaja en una referencia para que volver a pintar el
   * padre no reinyecte el editor: reinyectarlo tiraría los bloques que el niño
   * lleve puestos.
   */
  const publish = useRef(onProgramChange);
  publish.current = onProgramChange;

  useEffect(() => {
    if (!container.current) {
      return;
    }

    Blockly.setLocale(spanishMessages);
    defineGameBlocks();

    /*
     * Sin papelera, sin controles de zoom y sin sonidos, y no es cuestión de
     * gusto: son las tres cosas que piden ficheros sueltos de `media/`, que sin
     * configurar su ruta dan 404 en silencio. Borrar un bloque sigue estando a
     * mano por las dos vías de fábrica —arrastrarlo a la caja de herramientas y
     * el menú contextual, ahora en español—.
     */
    const workspace = Blockly.inject(container.current, {
      toolbox: TOOLBOX,
      trashcan: false,
      sounds: false,
      zoom: { controls: false, wheel: false, startScale: 1 },
      /*
       * La rueda NO mueve el lienzo, y es a propósito: el editor es una tarjeta
       * más de una pantalla larga, y si se queda la rueda, pasar el ratón por
       * encima atasca el desplazamiento de la página. Para moverse por el
       * lienzo están las barras y arrastrar el fondo.
       */
      move: { scrollbars: true, drag: true, wheel: false },
    });

    const report = () => publish.current(sealProgram(Blockly.serialization.workspaces.save(workspace)));

    /*
     * Los eventos de interfaz —seleccionar un bloque, abrir la caja— no cambian
     * el programa, así que no se avisa por ellos: publicarían el mismo JSON una
     * y otra vez.
     */
    workspace.addChangeListener((event: Blockly.Events.Abstract) => {
      if (!event.isUiEvent) {
        report();
      }
    });

    report();

    /*
     * Blockly tiene la misma trampa que `<Canvas>` —un padre sin altura lo deja
     * en cero— y una propia: al cambiar de tamaño su contenedor hay que
     * avisarle, o el lienzo se queda con las medidas viejas. Se vigila el
     * CONTENEDOR y no la ventana, porque la barra lateral del panel se pliega
     * sin que la ventana cambie de tamaño.
     */
    const observer = new ResizeObserver(() => Blockly.svgResize(workspace));
    observer.observe(container.current);

    return () => {
      observer.disconnect();
      workspace.dispose();
    };
  }, []);

  return <div ref={container} className="h-full w-full" />;
};
