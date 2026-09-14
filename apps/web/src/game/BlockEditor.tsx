import * as Blockly from 'blockly/core';
import * as SpanishMessages from 'blockly/msg/es';
import { useEffect, useRef } from 'react';
import { FLYOUT_BLOCKS, defineGameBlocks } from './blocks';
import { sealProgram, type Program, type WorkspaceState } from './program';

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
 * El español no es sólo el texto de nuestros bloques —ése nace en español
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

/*
 * La clase que apaga los recortes mientras hay un bloque en el aire. La regla
 * vive en `main.css`, junto a las zonas que recorta; aquí sólo se enciende,
 * porque quien se entera de que hay un arrastre en marcha es Blockly.
 */
const DRAGGING_CLASS = 'arrastrando-bloque';

/** Lo que tarda el bloque en volver a la caja. Lo bastante para verlo irse. */
const RETURN_MS = 320;

/**
 * El margen de la caja: por dónde empieza cada columna de bloques y, con él,
 * dónde aterriza el bloque que vuelve. Medido desde la esquina de la caja.
 */
const BOX_INSET = 14;

/*
 * LA REJILLA DE LA CAJA. Tres bloques por columna y dos columnas, o sea seis
 * huecos: los tres primeros bloques y, desde el mundo 2, «saltar». Se dejó sitio
 * de sobra a propósito, porque una caja que sólo enseña lo que ya tiene dentro se
 * ve estrecha el día que llegan más.
 *
 * `BOX_SCALE` es lo que se encoge un bloque de la caja respecto al que se suelta
 * en el lienzo, y sale de una medida, no del gusto: el más ancho de los tres
 * mide 169 px a tamaño del lienzo y la columna da para 146, margen incluido.
 * Encogerlos por el tema —letra y iconos más pequeños— no llega: los bloques de
 * `zelos` tienen alto y relleno mínimos, y se quedaban en 145.
 */
const BOX_COLUMNS = 2;
const BOX_ROWS = 3;
const BOX_SCALE = 0.72;

/*
 * EL ASPECTO DE LOS BLOQUES SALE DEL RENDERIZADOR, no de CSS. Blockly dibuja
 * cada bloque como un `<path>` calculado, así que redondearlos o engordarlos no
 * es cuestión de hojas de estilo: es elegir otro renderizador. `zelos` —el de
 * Scratch— es el que viene con bordes redondos, campos en píldora y texto
 * blanco en negrita, que es lo que pide una pantalla de niños; los otros dos
 * que trae `blockly/core` dibujan bloques de herramienta.
 *
 * Y la tipografía se le pasa por tema, para que los bloques no sean lo único de
 * la pantalla escrito en otra letra.
 */
const gameTheme = Blockly.Theme.defineTheme('codeplay', {
  name: 'codeplay',
  base: Blockly.Themes.Zelos,
  fontStyle: { family: "'Fredoka', 'Quicksand', sans-serif", weight: '600', size: 11 },
});

interface BlockEditorProps {
  onProgramChange: (program: Program) => void;
  /*
   * El hueco donde va la caja de bloques, que desde el J6.3 vive en OTRA zona de
   * la pantalla —la columna derecha— y no pegada al lienzo. Lo crea la
   * composición, que es quien sabe dónde va cada cosa, y baja hasta aquí como
   * dato: así la maqueta puede vivir por encima de la frontera diferida sin
   * importar Blockly.
   */
  flyoutHost: HTMLElement;
  /*
   * La disposición INICIAL de bloques del nivel, ya sacada de su sobre. Es el
   * `starterProgram` del contrato §2, y lo normal es que esté vacía: §7 llama a
   * eso «sin programa de partida» y es un nivel perfectamente corriente.
   */
  starterWorkspace: WorkspaceState;
}

export const BlockEditor = ({
  onProgramChange,
  flyoutHost,
  starterWorkspace,
}: BlockEditorProps) => {
  const container = useRef<HTMLDivElement>(null);

  /*
   * La llamada hacia arriba viaja en una referencia para que volver a pintar el
   * padre no reinyecte el editor: reinyectarlo tiraría los bloques que el niño
   * lleve puestos.
   */
  const publish = useRef(onProgramChange);
  publish.current = onProgramChange;

  /*
   * La disposición inicial se lee UNA vez, por lo mismo: si viajara en las
   * dependencias del efecto, el editor se reinyectaría —y con él se irían los
   * bloques que el niño lleve puestos— cada vez que el padre se repintara. Es
   * con lo que empieza el lienzo, no algo que cambie mientras se juega.
   */
  const starter = useRef(starterWorkspace);

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
      renderer: 'zelos',
      theme: gameTheme,
      trashcan: false,
      sounds: false,
      zoom: { controls: false, wheel: false, startScale: 1 },
      /*
       * SÓLO BARRA VERTICAL. La horizontal cruzaba el cuadro de edición por
       * debajo y no llevaba a ninguna parte: los bloques se encadenan hacia
       * abajo, así que a lo ancho no hay nada que buscar.
       *
       * La rueda NO mueve el lienzo, y es a propósito: el editor es una zona
       * más de una pantalla larga, y si se queda la rueda, pasar el ratón por
       * encima atasca el desplazamiento de la página. Para moverse por el
       * lienzo están la barra y arrastrar el fondo.
       */
      move: { scrollbars: { horizontal: false, vertical: true }, drag: true, wheel: false },
    });

    /*
     * LA CAJA DE BLOQUES, SUELTA. Blockly permite crear un flyout a mano y
     * colgarlo de cualquier nodo del DOM —`createDom` lo dice: puede existir
     * como su propio SVG—, y ésa es la única forma de que la caja esté en la
     * columna derecha y el lienzo abajo a la izquierda. `toolboxPosition` sólo
     * la mueve DENTRO de la inyección, y el hueco de una inyección es un
     * rectángulo: no puede cubrir dos esquinas opuestas de la pantalla.
     *
     * `setAutoClose(false)` la deja siempre abierta, que es lo que sustituye al
     * desplegable de la categoría.
     */
    const flyoutOptions = new Blockly.Options({
      renderer: 'zelos',
      theme: gameTheme,
      move: { scrollbars: false, drag: false, wheel: false },
      sounds: false,
    } as Blockly.BlocklyOptions);
    flyoutOptions.parentWorkspace = workspace;

    /*
     * El lado en el que está la caja. Ya NO decide qué se borra —de eso se
     * encarga la regla de más abajo—: lo único que gobierna aquí es por qué
     * lado se redondea el fondo de la caja, y la caja está a la derecha del
     * lienzo.
     */
    flyoutOptions.toolboxPosition = Blockly.utils.toolbox.Position.RIGHT;

    const flyout = new Blockly.VerticalFlyout(flyoutOptions);
    const flyoutWorkspace = flyout.getWorkspace();

    /*
     * Y LA CAJA DEJA DE SER ZONA DE BORRADO, entera.
     *
     * La de fábrica es un SEMIPLANO sin límite vertical —«todo lo que quede a
     * este lado de su borde»—, y con la caja fuera de la inyección no hay lado
     * que valga: a la izquierda se traga el lienzo, y a la derecha se traga
     * media pantalla. Un semiplano no puede describir lo que esta maqueta
     * necesita, que es «todo menos el lienzo». Devolviendo `null` la caja
     * desaparece de la lista de destinos de arrastre y la decisión se toma
     * abajo, con el bloque ya soltado y su posición delante.
     */
    flyout.getClientRect = () => null;

    /*
     * Y hay que quitarle además el sitio. Declararle el lado lo coloca contra el
     * borde derecho DEL LIENZO, que es donde estaría si fuera suyo: fuera de la
     * pantalla, a 1375 px en una ventana de 1280. Su sitio lo manda el hueco,
     * así que su origen es el de su hueco.
     */
    flyout.getX = () => 0;
    flyout.getY = () => 0;

    /*
     * Y LA ALTURA TAMBIÉN ES LA DEL HUECO, no la del lienzo. De fábrica la
     * hereda del espacio destino —`position()` lee sus métricas de vista—, y eso
     * era cosmético mientras el hueco la recortaba y la caja podía desplazarse.
     * Desde que no se desplaza deja de serlo: lo que no cabe no se alcanza, y
     * con los bloques del juego —más altos que los de fábrica— el tercero se
     * quedaba cortado. El fondo se sigue dibujando con la altura del lienzo, y
     * da igual: es transparente.
     */
    flyout.getHeight = () => flyoutHost.clientHeight;

    /*
     * Y EL ANCHO IGUAL, por un motivo nuevo: el SVG de la caja recorta lo que se
     * sale, y de fábrica su ancho es el del bloque más ancho más un margen. Con
     * una sola columna sobraba; con dos, la de la derecha caía fuera y no se
     * dibujaba.
     */
    flyout.getWidth = () => flyoutHost.clientWidth;

    /*
     * LOS BLOQUES DE LA CAJA SE PINTAN MÁS PEQUEÑOS QUE LOS DEL LIENZO. No es un
     * ajuste de tamaño: es lo que hace que quepan las dos columnas.
     *
     * Blockly documenta `getFlyoutScale` como el punto donde separar la escala de
     * la caja de la del lienzo, y `positionNewBlock` convierte entre las dos, así
     * que el bloque sigue cayendo donde el niño lo suelta. Crece al agarrarlo,
     * que es lo mismo que hace un bloque sacado de una caja con el lienzo
     * acercado.
     */
    flyout.getFlyoutScale = () => BOX_SCALE;

    /*
     * LA CAJA COLOCA EN REJILLA Y NO EN UNA COLUMNA. De fábrica apila hacia
     * abajo, y como este flyout no se desplaza —ver más abajo—, el cuarto bloque
     * se saldría del hueco sin forma de llegar a él.
     *
     * Los separadores que Blockly intercala entre bloques son huecos de una
     * columna, y en una rejilla no separan nada: se recogen en el origen para
     * que no estiren el contenido a lo alto.
     */
    const layoutBox = (contents: Blockly.FlyoutItem[]) => {
      flyoutWorkspace.scale = BOX_SCALE;

      // El hueco se mide en píxeles; la rejilla coloca en unidades del espacio.
      const cellWidth = flyoutHost.clientWidth / BOX_COLUMNS / BOX_SCALE;
      const cellHeight = flyoutHost.clientHeight / BOX_ROWS / BOX_SCALE;
      const inset = BOX_INSET / BOX_SCALE;
      let placed = 0;

      for (const item of contents) {
        const element = item.getElement();
        const at = element.getBoundingRectangle();

        if (item.getType() !== 'block') {
          element.moveBy(-at.left, -at.top);
          continue;
        }

        const column = Math.floor(placed / BOX_ROWS);
        const row = placed % BOX_ROWS;

        element.moveBy(
          column * cellWidth + inset - at.left,
          row * cellHeight + (cellHeight - at.getHeight()) / 2 - at.top,
        );
        placed += 1;
      }
    };

    (flyout as unknown as { layout_: typeof layoutBox }).layout_ = layoutBox;

    /*
     * El bloque tiene que caer DONDE SE SUELTA, y de fábrica cae en el origen
     * del lienzo. Blockly resta los orígenes de los dos espacios y mide cada uno
     * relativo a SU PROPIO `injectionDiv`; un flyout suelto no tiene ninguno, así
     * que las dos cifras salen en marcos distintos y la resta no significa nada.
     * Se le devuelve su origen medido en el marco del lienzo, que es contra
     * quien se va a restar.
     */
    flyoutWorkspace.getOriginOffsetInPixels = () => {
      const origin = flyoutWorkspace.getCanvas().getScreenCTM();
      const injection = workspace.getInjectionDiv().getBoundingClientRect();

      return origin === null
        ? new Blockly.utils.Coordinate(0, 0)
        : new Blockly.utils.Coordinate(origin.e - injection.left, origin.f - injection.top);
    };

    /*
     * Y LA CAJA TIENE QUE LLEVAR LAS CLASES DEL RENDERIZADOR Y DEL TEMA, o sus
     * bloques se pintan a medias.
     *
     * Blockly no da esos estilos sueltos: los inyecta con ámbito
     * —`.zelos-renderer.codeplay-theme …`— y pone las dos clases **en el
     * `injectionDiv`**, que un flyout suelto no tiene. Sin ellas la caja se
     * queda sin el `fill: #fff` del texto, sin los colores de los campos y sin
     * las reglas de pasar el ratón por encima: el síntoma es que **el texto de
     * los bloques desaparece al pasarles el cursor**.
     */
    flyoutHost.classList.add(
      workspace.getRenderer().getClassName(),
      workspace.getTheme().getClassName(),
    );

    const flyoutSvg = flyout.createDom(Blockly.utils.Svg.SVG);
    flyoutHost.appendChild(flyoutSvg);
    flyout.init(workspace);
    flyout.setAutoClose(false);
    flyout.show(FLYOUT_BLOCKS);

    /*
     * LA CAJA NO SE DESPLAZA. Blockly le pone barra siempre, la coloque o no
     * donde se ve la caja, y con los bloques colocados en rejilla lo único que
     * hace es estrecharlos. Los seis huecos de la rejilla se ven todos a la vez,
     * así que no hay a dónde desplazarse; del séptimo bloque en adelante habrá
     * que decidir cómo se llega a él.
     */
    flyoutWorkspace.scrollbar?.dispose();
    flyoutWorkspace.scrollbar = null;

    const report = () => publish.current(sealProgram(Blockly.serialization.workspaces.save(workspace)));

    /* Cuántos bloques van por el aire, contando los que vuelven a la caja. */
    let inTheAir = 0;
    const setDragging = (dragging: boolean) => {
      document.documentElement.classList.toggle(DRAGGING_CLASS, dragging);
    };

    /*
     * DÓNDE SOLTÓ EL NIÑO, apuntado ANTES de que Blockly toque nada.
     *
     * No vale medirlo cuando llega el evento de movimiento: Blockly reparte sus
     * eventos en un `requestAnimationFrame` y para entonces ya ha recolocado el
     * lienzo —medido: un bloque soltado 257 px por encima del lienzo aparece
     * pegado a su borde superior, porque el espacio se ha desplazado hasta
     * él—. Este oyente va en fase de captura, así que corre antes que el de
     * Blockly y ve la escena tal y como el niño la dejó.
     */
    let dragged: string | null = null;
    let drop: { x: number; y: number; left: number; top: number } | null = null;

    const rememberDrop = (event: PointerEvent) => {
      const block = dragged === null ? null : (workspace.getBlockById(dragged) as Blockly.BlockSvg | null);
      const at = block === null ? null : block.getSvgRoot().getBoundingClientRect();

      drop = at === null ? null : { x: event.clientX, y: event.clientY, left: at.left, top: at.top };
    };

    document.addEventListener('pointerup', rememberDrop, true);

    /** Si el punto donde soltó cae fuera del lienzo. */
    const outsideCanvas = (point: { x: number; y: number }): boolean => {
      if (container.current === null) {
        return false;
      }

      const canvas = container.current.getBoundingClientRect();

      return (
        point.x < canvas.left ||
        point.x > canvas.right ||
        point.y < canvas.top ||
        point.y > canvas.bottom
      );
    };

    /*
     * SOLTAR FUERA DEL LIENZO DEVUELVE EL BLOQUE A LA CAJA, Y SE VE VOLVER.
     *
     * Que desapareciera donde se soltó es lo que hacía la zona de borrado de
     * fábrica, y era un agujero: el bloque no se veía, no se recuperaba y nada
     * se lo decía al niño. Se anima hasta la caja —que es de donde salen los
     * bloques y donde siempre están los tres— para que vea A DÓNDE ha ido, y no
     * sólo que ya no está.
     *
     * El vuelo se pinta moviendo el propio bloque y no una copia: la copia
     * perdería los filtros que Blockly define dentro de su SVG y saldría en
     * negro o directamente no saldría.
     */
    const flyBackToBox = (block: Blockly.BlockSvg, from: { left: number; top: number }) => {
      const root = block.getSvgRoot();
      const now = root.getBoundingClientRect();
      const box = flyoutSvg.getBoundingClientRect();
      const at = block.getRelativeToSurfaceXY();

      inTheAir += 1;
      setDragging(true);

      /*
       * El vuelo empieza DONDE SE SOLTÓ y no donde Blockly haya dejado el
       * bloque: si no, se le vería entrar de un salto en el lienzo antes de
       * salir volando. La escala del lienzo está fija en 1, así que un píxel de
       * pantalla es una unidad del espacio de trabajo.
       */
      const startX = at.x + (from.left - now.left);
      const startY = at.y + (from.top - now.top);

      root.style.transition = 'none';
      root.style.transform = `translate(${startX}px, ${startY}px)`;
      root.getBoundingClientRect();

      root.style.transition = `transform ${RETURN_MS}ms ease-in`;
      root.style.transform = `translate(${startX + box.left + BOX_INSET - from.left}px, ${startY + box.top + BOX_INSET - from.top}px)`;

      /*
       * El cierre va en `finally` y no detrás del `dispose`: un bloque que ya
       * no existe —dos retornos encadenados, o uno que Blockly se llevó por
       * medio— hace que `dispose` lance, y con el cierre detrás la clase que
       * apaga los recortes se quedaría puesta PARA SIEMPRE. Con ella puesta la
       * bandeja se queda por encima de todo y sin recortar: la pantalla se ve
       * rota y no hay forma de volver sin recargar.
       */
      window.setTimeout(() => {
        try {
          if (!block.isDisposed()) {
            block.dispose(false);
          }
        } finally {
          inTheAir -= 1;

          if (inTheAir === 0) {
            setDragging(false);
          }
        }
      }, RETURN_MS);
    };

    /*
     * Los eventos de interfaz —seleccionar un bloque, abrir la caja— no cambian
     * el programa, así que no se avisa por ellos: publicarían el mismo JSON una
     * y otra vez. El del arrastre sí se mira, porque es lo que dice cuándo hay
     * un bloque en el aire al que no puede recortarle nadie.
     */
    workspace.addChangeListener((event: Blockly.Events.Abstract) => {
      if (event.type === Blockly.Events.BLOCK_DRAG) {
        const started = (event as Blockly.Events.BlockDrag).isStart === true;

        if (started) {
          dragged = (event as Blockly.Events.BlockDrag).blockId ?? null;
          drop = null;
        }

        setDragging(started);

        return;
      }

      if (event.type === Blockly.Events.BLOCK_MOVE) {
        const move = event as Blockly.Events.BlockMove;
        const block =
          move.blockId === undefined ? null : (workspace.getBlockById(move.blockId) as Blockly.BlockSvg | null);

        /*
         * Sólo los movimientos que TERMINAN un arrastre, y sólo los del bloque
         * que quedó suelto: uno que se encadenó a otro está dentro del lienzo
         * por definición.
         */
        if (
          move.reason?.includes('drag') === true &&
          move.newParentId === undefined &&
          block !== null &&
          drop !== null &&
          outsideCanvas(drop)
        ) {
          flyBackToBox(block, drop);
        }
      }

      if (!event.isUiEvent) {
        report();
      }
    });

    /*
     * Los bloques con los que el nivel arranca, si trae alguno. Va DESPUÉS del
     * oyente para que cargarlos publique el programa hacia arriba como cualquier
     * otro cambio, y sólo si hay algo que cargar: un sobre vacío es un lienzo
     * vacío, no una orden de borrar nada.
     */
    if (Object.keys(starter.current).length > 0) {
      Blockly.serialization.workspaces.load(starter.current, workspace);
    }

    report();

    /*
     * Blockly tiene la misma trampa que `<Canvas>` —un padre sin altura lo deja
     * en cero— y una propia: al cambiar de tamaño su contenedor hay que
     * avisarle, o el lienzo se queda con las medidas viejas. Se vigila el
     * CONTENEDOR y no la ventana, porque la barra lateral del panel se pliega
     * sin que la ventana cambie de tamaño.
     */
    /*
     * El lienzo empieza ARRIBA, no por donde Blockly lo deje. De fábrica centra
     * la vista en el contenido, y con el lienzo vacío eso deja la barra a media
     * altura: el niño ve sitio por encima de donde va a soltar el primer bloque
     * y no sabe que no hay nada ahí.
     *
     * Es `scroll(0, 0)` y NO `scrollbar.setY(0)`, que era lo evidente: la barra
     * al tope deja la vista en el tope del ÁREA DESPLAZABLE, que Blockly extiende
     * media pantalla por encima del contenido, así que los bloques se quedaban
     * fuera por abajo. Medido: con `setY(0)` caían en y 853 y 993 con el lienzo
     * acabando en 845; con `scroll(0, 0)`, en 675 y 815.
     */
    const scrollToTop = () => workspace.scroll(0, 0);
    scrollToTop();

    const observer = new ResizeObserver(() => {
      Blockly.svgResize(workspace);
      scrollToTop();

      // La caja se recoloca con el lienzo, aunque ya no herede ni alto ni ancho.
      flyout.position();
      layoutBox(flyout.getContents());
    });
    observer.observe(container.current);

    return () => {
      flyoutHost.classList.remove(
        workspace.getRenderer().getClassName(),
        workspace.getTheme().getClassName(),
      );
      document.removeEventListener('pointerup', rememberDrop, true);
      observer.disconnect();
      setDragging(false);
      flyout.dispose();
      workspace.dispose();
    };
  }, [flyoutHost]);

  return <div ref={container} className="h-full w-full" />;
};
