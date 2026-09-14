import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { BlockEditorLoader } from '../../../game/BlockEditorLoader';
import { GameSceneLoader } from '../../../game/GameSceneLoader';
import { openLevel, type PlayableLevel } from '../../../game/levelConfig';
import type { Program } from '../../../game/program';
import { worldsService } from '../../../services/worlds.service';

/* El rótulo de la caja: tres piezas encajadas, que es lo que se hace con los bloques. */
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
    <rect
      x="4"
      y="2.5"
      width="16"
      height="19"
      rx="3.2"
      fill="#F0E6FF"
      stroke="#7B3FE4"
      strokeWidth="1.8"
    />
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

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M15 6L9 12L15 18"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* Los mismos tres números que la maqueta del J6.3 dejó medidos. */
const CANVAS_HEIGHT = 130;
const CANVAS_MIN = 90;
const CANVAS_MAX = 380;

/*
 * Tres estados excluyentes, no banderas sueltas: se está leyendo la fila, la
 * fila no se puede jugar, o hay nivel. El del medio es el del contrato §7 y no
 * es una catástrofe: es un nivel que este juego no sabe cargar.
 */
type LevelState =
  | { status: 'loading' }
  | { status: 'rejected' }
  | { status: 'ready'; title: string; instructions: string; level: PlayableLevel };

type StudentLevelModuleProps = {
  levelId: string;
  worldId: string;
};

/*
 * La pantalla donde se juega un nivel, y la primera de producto que monta el
 * juego: hasta ahora sólo lo hacía el banco de pruebas, que vive detrás de una
 * bandera de desarrollo.
 *
 * La composición es la que el J6.3 ensayó allí —el 3D de borde a borde con la
 * bandeja del lienzo superpuesta abajo y los paneles flotando a la derecha—, y
 * este archivo la POSEE igual que aquél: no sabe nada de Blockly ni de three, y
 * lo que baja a las piezas diferidas son tres huecos vacíos y datos.
 *
 * Lo que sí hace y el laboratorio no: LEER LA FILA Y COMPROBARLA. Aquí está el
 * anfitrión del contrato, así que aquí se decide si el nivel se juega o no se
 * carga (§7), y por eso la comprobación corre por encima de las dos fronteras
 * diferidas: un nivel que no se puede leer no descarga el motor 3D.
 */
export const StudentLevelModule = ({ levelId, worldId }: StudentLevelModuleProps) => {
  const navigate = useNavigate();
  const [state, setState] = useState<LevelState>({ status: 'loading' });

  const [program, setProgram] = useState<Program | null>(null);
  const handleProgramChange = useCallback((next: Program) => setProgram(next), []);

  const [blockBox, setBlockBox] = useState<HTMLDivElement | null>(null);
  const [controlsHost, setControlsHost] = useState<HTMLDivElement | null>(null);
  const [messageHost, setMessageHost] = useState<HTMLDivElement | null>(null);

  const [canvasOpen, setCanvasOpen] = useState(true);
  const [canvasHeight, setCanvasHeight] = useState(CANVAS_HEIGHT);
  const resizing = useRef<{ y: number; height: number } | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async (): Promise<void> => {
      const result = await worldsService.getLevelById(levelId);

      if (!mounted) {
        return;
      }

      const row = result.data;

      if (row === null) {
        setState({ status: 'rejected' });
        return;
      }

      /*
       * La puerta única del §7: la versión, el puzle y el sobre se comprueban
       * juntos y el nivel se acepta o se rechaza entero. Las filas que
       * siguen sembradas con el contenido del juego anterior salen por aquí.
       */
      const level = openLevel({
        formatVersion: row.formatVersion,
        config: row.config,
        starterCode: row.starterCode,
      });

      if (level === null) {
        setState({ status: 'rejected' });
        return;
      }

      setState({ status: 'ready', title: row.name, instructions: row.narrative, level });
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [levelId]);

  const startResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!canvasOpen) {
        return;
      }

      /*
       * `setPointerCapture` lanza si el puntero ya no existe, y hacerlo dentro
       * de un manejador de React se lleva por delante el árbol entero.
       */
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Sin captura el arrastre sigue funcionando mientras no salga del asa.
      }

      resizing.current = { y: event.clientY, height: canvasHeight };
    },
    [canvasHeight, canvasOpen]
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

  const backToLevels = () => navigate(`${ROUTES.WORLDS}/${worldId}`);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-5">
        <div className="h-14 w-14 animate-spin rounded-full border-[5px] border-line border-t-grape" />
        <span className="sr-only">Cargando el nivel…</span>
      </div>
    );
  }

  /*
   * El §7 dicho para un niño: que este nivel no se puede jugar y por dónde
   * seguir. Ni el JSON, ni la versión que no cuadra, ni un error de consola: la
   * fila está mal sembrada y eso no es asunto suyo.
   */
  if (state.status === 'rejected') {
    return (
      <div className="px-5 py-5">
        <section className="card p-6 text-center">
          <h1 className="title-lg">Este nivel todavía no se puede jugar</h1>
          <p className="subtitle mx-auto mt-2 max-w-[520px]">
            Estamos preparándolo. Vuelve a la lista y prueba con otro.
          </p>

          <button type="button" onClick={backToLevels} className="btn btn-grape mt-5">
            <BackIcon />
            Volver a los niveles
          </button>
        </section>
      </div>
    );
  }

  // El sobre vacío es `{}`, así que esto distingue «no hay bloques» de «no ha llegado».
  const emptyCanvas = program === null || Object.keys(program.workspace).length === 0;

  return (
    <div className="px-5 py-5">
      <section className="card flex flex-wrap items-center gap-4 px-5 py-4">
        <button type="button" onClick={backToLevels} className="btn btn-sm btn-ghost">
          <BackIcon />
          Volver a los niveles
        </button>

        <h1 className="title-lg">{state.title}</h1>
      </section>

      {/*
       * Alto fijo a propósito: la escena se ajusta a su padre y el lienzo
       * también, así que un padre sin altura los deja a los dos en cero.
       */}
      <section className="marco-del-juego mt-5 grid h-[640px] gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="zona-del-juego relative overflow-hidden rounded-[28px]">
          <GameSceneLoader
            level={state.level.config}
            program={program}
            controlsHost={controlsHost}
            messageHost={messageHost}
          />

          <div className="bandeja-del-lienzo absolute inset-x-4 bottom-4 rounded-[24px] bg-mist shadow-[0_10px_28px_rgba(42,27,69,0.16)] backdrop-blur-sm">
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
              <div
                style={{ height: canvasOpen ? canvasHeight : 0 }}
                className="marco-del-lienzo relative w-full overflow-hidden"
              >
                <span className="pointer-events-none absolute inset-y-0 left-0 right-6 rounded-[18px] border-2 border-dashed border-mist-line bg-mist-soft" />

                {emptyCanvas && (
                  <p className="pointer-events-none absolute inset-y-0 left-0 right-6 flex items-center justify-center text-center font-display text-[15px] text-ink-faint">
                    Aquí verás la secuencia de bloques que crees.
                  </p>
                )}

                {blockBox !== null && (
                  <BlockEditorLoader
                    onProgramChange={handleProgramChange}
                    flyoutHost={blockBox}
                    starterWorkspace={state.level.workspace}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-[24px] bg-mist shadow-[0_8px_24px_rgba(42,27,69,0.12)]">
          <div className="px-4 pb-4 pt-3.5">
            <div className="flex items-center gap-2.5">
              <BlocksIcon />
              <h2 className="font-display text-[18px] text-grape-dark">Bloques</h2>
            </div>

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

            {/*
             * Lo que hay que hacer sale de la NARRATIVA DE LA FILA, no escrito
             * aquí: cambiar lo que se le pide al niño es cambiar un dato del
             * nivel, no publicar la aplicación otra vez.
             */}
            <p className="mt-2.5 text-[15px] font-semibold leading-[1.6] text-ink-soft">
              {state.instructions}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
