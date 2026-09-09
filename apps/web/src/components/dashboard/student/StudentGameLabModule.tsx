import { useCallback, useRef, useState } from 'react';
import { BlockEditorLoader } from '../../../game/BlockEditorLoader';
import { GameSceneLoader } from '../../../game/GameSceneLoader';
import type { Program } from '../../../game/program';
import { PalmFrond } from '../../decor/JungleDecor';

const CubeIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
      fill="#F0E6FF"
      stroke="#2A1B45"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M4 7.5L12 12L20 7.5M12 12V21"
      stroke="#2A1B45"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  </svg>
);

/* El rótulo de la caja: tres piezas, como los tres bloques que ofrece. */
const BlocksIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2.5" y="12.5" width="8.5" height="8.5" rx="2.4" fill="#7B3FE4" />
    <rect x="13" y="12.5" width="8.5" height="8.5" rx="2.4" fill="#3B9DF8" />
    <rect x="7.75" y="3" width="8.5" height="8.5" rx="2.4" fill="#A77BF3" />
  </svg>
);

/* El rótulo del lienzo, con el verde del suelo del tablero. */
const CanvasIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2.5L21 7.5V16.5L12 21.5L3 16.5V7.5L12 2.5Z" fill="#1F9D5B" />
    <path d="M3 7.5L12 12.5L21 7.5M12 12.5V21.5" stroke="#4ECB85" strokeWidth="1.6" />
  </svg>
);

const NoteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="2.5" width="16" height="19" rx="3.2" fill="#F0E6FF" stroke="#7B3FE4" strokeWidth="1.8" />
    <path d="M8 8.5h8M8 12.5h8M8 16.5h5" stroke="#7B3FE4" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/* El tirador y el pliegue de la bandeja. Una flecha que dice hacia dónde va. */
const ChevronIcon = ({ up }: { up: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BulbIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3a6 6 0 0 0-3.4 10.94V16.5h6.8v-2.56A6 6 0 0 0 12 3Z"
      fill="#FFC93C"
      stroke="#8B82A6"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M9.6 19.2h4.8" stroke="#8B82A6" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/*
 * Lo que mide el lienzo al abrir la pantalla, y hasta dónde se le deja llegar.
 *
 * ABRE BAJO, y es la altura de partida lo único que baja: el tirador y el
 * pliegue siguen llegando a los mismos topes. La bandeja tapa la mitad de abajo
 * del juego, y quien entra por primera vez viene a mirar el tablero, no a
 * construir; los bloques caben en cuanto tira del asa, y el tablero no se
 * recupera si empieza escondido.
 */
const CANVAS_HEIGHT = 130;
const CANVAS_MIN = 90;
const CANVAS_MAX = 380;

/*
 * El banco de pruebas de la fase A del juego, y NO es de usar y tirar: el J2, el
 * J4, el J5 y el J6 se ven funcionar aquí, porque la pantalla de nivel real no
 * llega hasta el J8. Desde el J6.3 esta pantalla ES la maqueta de aquélla.
 *
 * LA MAQUETA SON PANELES FLOTANTES sobre el juego, no tarjetas apiladas: el 3D
 * llena su zona de borde a borde y encima van, superpuestos, la bandeja del
 * lienzo abajo y los dos paneles de la derecha —la caja con sus botones y las
 * instrucciones—.
 *
 * Este archivo POSEE la maqueta y no sabe nada de Blockly ni de three. Lo que
 * baja a las dos piezas diferidas son tres huecos vacíos: el de la caja de
 * bloques, el de los botones y el del mensaje. Cada pieza pinta dentro del suyo
 * desde el otro lado de su frontera, así que la composición puede vivir aquí
 * arriba sin arrastrar ni el editor ni el intérprete al trozo principal.
 *
 * Los huecos van en ESTADO y no en una referencia: una referencia no provoca
 * repintado, y las piezas se montarían contra un hueco que todavía es `null`.
 */
export const StudentGameLabModule = () => {
  const [program, setProgram] = useState<Program | null>(null);
  const handleProgramChange = useCallback((next: Program) => setProgram(next), []);

  const [blockBox, setBlockBox] = useState<HTMLDivElement | null>(null);
  const [controlsHost, setControlsHost] = useState<HTMLDivElement | null>(null);
  const [messageHost, setMessageHost] = useState<HTMLDivElement | null>(null);

  // El sobre vacío es `{}`, así que esto distingue «no hay bloques» de «no ha llegado».
  const emptyCanvas = program === null || Object.keys(program.workspace).length === 0;

  /*
   * EL LIENZO SE PLIEGA Y SE ESTIRA, porque tapa el juego justo cuando hay algo
   * que mirar: el niño construye, ejecuta, y entonces la bandeja le estorba.
   *
   * Plegar NO desmonta el editor, sólo le deja el hueco en cero: el espacio de
   * trabajo de Blockly vive en ese componente, así que desmontarlo se llevaría
   * por delante los bloques que el niño lleve puestos. Al volver a abrirlo están
   * donde estaban.
   */
  const [canvasOpen, setCanvasOpen] = useState(true);
  const [canvasHeight, setCanvasHeight] = useState(CANVAS_HEIGHT);
  const resizing = useRef<{ y: number; height: number } | null>(null);

  const startResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!canvasOpen) {
        return;
      }

      /*
       * `setPointerCapture` lanza si el puntero ya no existe, y hacerlo dentro
       * de un manejador de React se lleva por delante el árbol entero: la
       * pantalla se queda en blanco por no poder capturar un ratón.
       */
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Sin captura el arrastre sigue funcionando mientras no salga del asa.
      }

      resizing.current = { y: event.clientY, height: canvasHeight };
    },
    [canvasHeight, canvasOpen],
  );

  const doResize = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const from = resizing.current;

    if (from === null) {
      return;
    }

    // Tirar hacia ARRIBA agranda: la bandeja está anclada abajo y crece contra el juego.
    const next = from.height + (from.y - event.clientY);
    setCanvasHeight(Math.min(CANVAS_MAX, Math.max(CANVAS_MIN, next)));
  }, []);

  const endResize = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    resizing.current = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ya estaba suelto; soltar dos veces no es un fallo que deba subir.
    }
  }, []);

  return (
    <div className="px-5 py-5">
      <section className="card relative overflow-hidden px-5 py-5">
        <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-grape-soft" />
        <PalmFrond
          size={84}
          className="pointer-events-none absolute -left-6 -bottom-10 rotate-[18deg] opacity-80"
        />

        <div className="relative flex flex-wrap items-center gap-4">
          <span className="flex h-[56px] w-[56px] items-center justify-center rounded-[18px] border-[3px] border-ink bg-grape-soft shadow-[0_4px_0_rgba(42,27,69,0.2)]">
            <CubeIcon />
          </span>

          <div>
            <h1 className="title-xl">Laboratorio 3D</h1>
            <p className="subtitle mt-1">
              El banco de pruebas del juego, compuesto como estará la pantalla de nivel.
            </p>
          </div>

          <span className="chip chip-coral ml-auto">Sólo en desarrollo</span>
        </div>
      </section>

      {/*
       * Alto fijo a propósito: la escena se ajusta a su padre y el lienzo
       * también, así que un padre sin altura los deja a los dos en cero. Si no
       * se ve nada, éste es el primer sospechoso.
       */}
      <section className="marco-del-juego mt-5 grid h-[640px] gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="zona-del-juego relative overflow-hidden rounded-[28px]">
          <GameSceneLoader
            program={program}
            controlsHost={controlsHost}
            messageHost={messageHost}
          />

          {/*
           * LA BANDEJA DEL LIENZO, superpuesta al juego y no debajo de él: es un
           * rectángulo más pequeño dentro de la misma zona, no un apartado
           * aparte.
           */}
          <div className="bandeja-del-lienzo absolute inset-x-4 bottom-4 rounded-[24px] bg-mist shadow-[0_10px_28px_rgba(42,27,69,0.16)] backdrop-blur-sm">
            {/*
             * El tirador para estirar la bandeja. Va en su borde de arriba, que
             * es el que se mueve: está anclada abajo y crece contra el juego.
             */}
            <div
              onPointerDown={startResize}
              onPointerMove={doResize}
              onPointerUp={endResize}
              onPointerCancel={endResize}
              className={`group flex h-4 items-center justify-center rounded-t-[24px] ${
                canvasOpen ? 'cursor-ns-resize' : ''
              }`}
              aria-hidden="true"
            >
              {canvasOpen && (
                <span className="h-1 w-10 rounded-full bg-mist-line transition-colors group-hover:bg-ink-faint" />
              )}
            </div>

            <div className="flex items-center gap-3 px-5 pb-1">
              <CanvasIcon />
              <h2 className="shrink-0 font-display text-[18px] text-grape-dark">Lienzo</h2>

              {/* El hueco del mensaje, que lo pinta la escena con un portal. */}
              <div ref={setMessageHost} className="min-w-0" />

              <button
                type="button"
                onClick={() => setCanvasOpen((open) => !open)}
                className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-grape-dark transition-colors hover:bg-mist-soft"
                aria-expanded={canvasOpen}
              >
                <ChevronIcon up={!canvasOpen} />
                <span className="sr-only">
                  {canvasOpen ? 'Plegar el lienzo' : 'Abrir el lienzo'}
                </span>
              </button>
            </div>

            <div className="px-4 pb-4">
              {/*
               * El hueco del editor llega hasta el borde, pero EL CUADRO NO: se
               * dibuja aparte y acaba antes, para que la barra de desplazamiento
               * —que Blockly pinta pegada al borde derecho del suyo— quede fuera
               * y no cruce la zona donde el niño coloca los bloques.
               *
               * Plegado es alto CERO y no `display: none`: el editor sigue
               * montado, así que los bloques siguen ahí al volver a abrirlo.
               *
               * Y sin transición: animar el alto obliga a Blockly a recomponerse
               * en cada frame —el `ResizeObserver` del editor mira este mismo
               * hueco—, y encima una transición no avanza si la página está
               * estrangulada, con lo que el pliegue se quedaría a medias.
               */}
              <div
                style={{ height: canvasOpen ? canvasHeight : 0 }}
                className="marco-del-lienzo relative w-full overflow-hidden"
              >
                <span className="pointer-events-none absolute inset-y-0 left-0 right-6 rounded-[18px] border-2 border-dashed border-mist-line bg-mist-soft" />

                {/*
                 * El vacío del lienzo, DEBAJO del editor: los dos fondos de
                 * Blockly van transparentes (`main.css`) para que se vea a
                 * través, y así el bloque que el niño arrastra se sigue
                 * dibujando por encima.
                 */}
                {emptyCanvas && (
                  <p className="pointer-events-none absolute inset-y-0 left-0 right-6 flex items-center justify-center text-center font-display text-[15px] text-ink-faint">
                    Aquí verás la secuencia de bloques que crees.
                  </p>
                )}

                {blockBox !== null && (
                  <BlockEditorLoader onProgramChange={handleProgramChange} flyoutHost={blockBox} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/*
         * LOS DOS APARTADOS VAN PEGADOS, en un solo panel, y lo que los separa
         * es una línea clara. Eran dos tarjetas con un hueco entre medias y se
         * leían como dos sitios distintos de la pantalla; son dos apartados del
         * mismo sitio.
         */}
        <div className="flex flex-col rounded-[24px] bg-mist shadow-[0_8px_24px_rgba(42,27,69,0.12)]">
          <div className="px-4 pb-4 pt-3.5">
            <div className="flex items-center gap-2.5">
              <BlocksIcon />
              <h2 className="font-display text-[18px] text-grape-dark">Bloques</h2>
            </div>

            {/*
             * El hueco de la caja. Va `relative` porque el flyout se coloca
             * absoluto dentro de él, y su alto es el que los tres bloques piden:
             * la caja ya no lo hereda del lienzo, ver `BlockEditor.tsx`.
             */}
            <div className="mt-2.5 rounded-[18px] bg-mist-soft p-2">
              <div ref={setBlockBox} className="relative h-[240px] w-full" />
            </div>

            {/* El hueco de los tres botones, que los pinta la escena con un portal. */}
            <div ref={setControlsHost} className="mt-3.5" />
          </div>

          <div className="flex flex-1 flex-col border-t-2 border-mist-line px-4 pb-4 pt-3.5">
            <div className="flex items-center gap-2.5">
              <NoteIcon />
              <h2 className="font-display text-[18px] text-grape-dark">Instrucciones</h2>
            </div>

            <p className="mt-2.5 text-[15px] font-semibold leading-[1.6] text-ink-soft">
              Lleva al personaje hasta la casilla dorada sin pisar los muros ni el hueco.
            </p>

            {/*
             * El recuadro CRECE con lo que sobre, y no lo deja en blanco debajo:
             * el texto del nivel real no tiene una longitud fija, así que la
             * zona no puede estar cortada a la medida del de ejemplo.
             */}
            <div className="mt-3 flex flex-1 gap-2 rounded-[16px] bg-mist-soft px-3 py-2.5">
              <span className="mt-0.5 shrink-0">
                <BulbIcon />
              </span>
              <p className="text-[13px] font-semibold leading-[1.55] text-ink-faint">
                <span className="text-ink-soft">Texto de ejemplo:</span>{' '}
                <em>
                  el de verdad saldrá de la narrativa del nivel cuando la pantalla lea su fila de la
                  base, en el J8.
                </em>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="card mt-5 overflow-hidden">
        <div className="border-b-[3px] border-ink bg-lavender px-5 py-4">
          <h3 className="font-display text-[17px] text-ink">El programa que producen</h3>
          <p className="mt-2 text-[15px] font-semibold leading-[1.6] text-ink-soft">
            Es el sobre del contrato: la versión del formato y, dentro, lo que serializa el editor.
            Se manda tal cual cuando el niño termine un nivel, que es el J9. No está en la maqueta
            del nivel a propósito —es el instrumento de este banco de pruebas—, pero es la única
            comprobación de que el editor sigue publicando.
          </p>
          <pre className="mt-3 max-h-[220px] overflow-auto rounded-[14px] border-[3px] border-ink bg-cream px-4 py-3 text-[13px] leading-[1.5] text-ink">
            {program ? JSON.stringify(program, null, 2) : 'Cargando los bloques…'}
          </pre>
        </div>
      </section>

      <p className="mt-4 text-[15px] font-semibold leading-[1.6] text-ink-soft">
        Esta pantalla no forma parte del producto: existe únicamente cuando la aplicación se ejecuta
        en desarrollo, y en la compilación de producción no hay forma de llegar a ella.
      </p>
    </div>
  );
};
