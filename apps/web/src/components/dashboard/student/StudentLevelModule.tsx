import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { BlockEditorLoader } from '../../../game/BlockEditorLoader';
import type { LevelFinish } from '../../../game/GameScene';
import { GameSceneLoader } from '../../../game/GameSceneLoader';
import { useAuth } from '../../../hooks/useAuth';
import { openLevel, type PlayableLevel } from '../../../game/levelConfig';
import type { Program } from '../../../game/program';
import { scoreForSteps } from '../../../game/score';
import { progressService } from '../../../services/progress.service';
import { worldsService } from '../../../services/worlds.service';
import type {
  AchievementUnlock,
  AttemptOutcome,
  MissionCompletionUnlock,
} from '../../../types/progress.types';
import { HaltedLock } from './HaltedLock';
import { AchievementToast } from './AchievementToast';
import { LevelCompleteDialog } from './LevelCompleteDialog';
import { blockingLevel } from './levelLock';
import { nextLevelId } from './nextLevel';
import { submitAttempt } from './submitAttempt';

/* El rótulo de la caja: tres piezas encajadas, que es lo que se hace con los bloques. */
/*
 * Una referencia estable para la cola de avisos: `outcome?.x ?? []` construiría
 * un array nuevo en cada pintado, y el efecto que vacía la cola depende de esa
 * identidad —se reiniciaría sola y el aviso no se iría nunca—.
 */
const EMPTY_UNLOCKED: AchievementUnlock[] = [];
/* La gemela de arriba, y por el mismo motivo: la identidad tiene que ser estable. */
const EMPTY_MISSIONS: MissionCompletionUnlock[] = [];

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

const HelpIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M9 9.2a3 3 0 1 1 4.2 2.75c-.75.33-1.2 1.05-1.2 1.87v.68"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <circle cx="12" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

/*
 * Tres estados excluyentes, no banderas sueltas: se está leyendo la fila, la
 * fila no se puede jugar, o hay nivel. El del medio es el del contrato §7 y no
 * es una catástrofe: es un nivel que este juego no sabe cargar.
 */
type LevelState =
  | { status: 'loading' }
  | { status: 'rejected' }
  | { status: 'locked'; previousLevelName: string }
  | {
      status: 'ready';
      title: string;
      instructions: string;
      level: PlayableLevel;
      nextLevelId: string | null;
      withJump: boolean;
      fillGaps: boolean;
      centerPillar: boolean;
    };

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
  const location = useLocation();
  const { applyTotalXp, user } = useAuth();

  /*
   * El nivel que se acaba de superar, si se llegó por «Siguiente nivel». La
   * ventana sale sin esperar al guardado, así que el progreso que lee el
   * candado puede no traerlo todavía y cerraría el nivel que se acaba de ganar.
   * En una referencia porque sólo vale para la carga de esta entrada.
   */
  const justPassed = useRef((location.state as { passedLevelId?: string } | null)?.passedLevelId);
  const userId = user?.id ?? null;
  const [state, setState] = useState<LevelState>({ status: 'loading' });

  const [program, setProgram] = useState<Program | null>(null);
  const handleProgramChange = useCallback((next: Program) => setProgram(next), []);

  const [blockBox, setBlockBox] = useState<HTMLDivElement | null>(null);
  const [controlsHost, setControlsHost] = useState<HTMLDivElement | null>(null);
  const [messageHost, setMessageHost] = useState<HTMLDivElement | null>(null);

  const [trayOpen, setTrayOpen] = useState(true);

  const [helpOpen, setHelpOpen] = useState(false);

  const [halted, setHalted] = useState(false);
  const [finish, setFinish] = useState<LevelFinish | null>(null);

  /*
   * Que la ÚLTIMA partida no se pudiera guardar. Se dice en la ventana y no se
   * espera por ello: el contrato §7 prohíbe bloquear al niño esperando
   * confirmación, así que la felicitación sale igual y el aviso llega detrás.
   */
  const [saveFailed, setSaveFailed] = useState(false);

  /*
   * Lo que el servidor concedió por la ÚLTIMA partida: la puntuación que
   * calculó, la marca que queda y la XP que sumó. Nace vacío en cada partida
   * porque la ventana sale antes de que llegue, y enseñar lo de la anterior
   * sería peor que no enseñar nada.
   */
  const [outcome, setOutcome] = useState<AttemptOutcome | null>(null);

  /*
   * EL INTENTO SE MANDA AQUÍ, en el manejador y nunca en un efecto: con
   * `React.StrictMode` un efecto corre dos veces en desarrollo, y aquí eso
   * serían dos filas en `level_attempts` y dos llamadas contadas en
   * `user_progress.attempt_count` por una sola partida. La escena ya avisa una
   * vez por recorrido terminado, y este camino no añade otra ocasión.
   *
   * La ventana sale sólo al llegar a la meta; el guardado ocurre siempre, que es
   * lo que separa «el niño superó el nivel» de «el niño jugó».
   */
  const handleFinish = useCallback(
    (result: LevelFinish) => {
      if (result.success) {
        setFinish(result);
      }

      setOutcome(null);
      setSaveFailed(false);

      void submitAttempt(levelId, result).then((saved) => {
        setOutcome(saved);
        setSaveFailed(saved === null);

        /*
         * El XP del panel se pone al día AQUÍ, con el total que devuelve el
         * servidor. Sin esto la barra lateral se queda diciendo lo de antes
         * hasta recargar, que es lo que hacía antes del J11 — medido: la base en
         * 693 y la pantalla en 683.
         */
        if (saved !== null) {
          applyTotalXp(saved.totalXp);
        }
      });
    },
    [applyTotalXp, levelId]
  );

  /*
   * «Volver a intentar» MONTA LA ESCENA DE NUEVO, y es lo que devuelve personaje,
   * contador e intento a la salida: el intento vive dentro de la escena y no
   * sube. El editor no cuelga de esta clave, así que los bloques se quedan.
   */
  const [attemptKey, setAttemptKey] = useState(0);

  /*
   * Dónde empieza la bandeja AL ABRIR, que es lo que el encuadre de partida deja
   * libre. Se mide una vez: plegar la bandeja después no vuelve a encuadrar, porque la vista de partida no cambia mientras se juega.
   */
  const [trayTop, setTrayTop] = useState<number | null>(null);
  const measureTray = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setTrayTop((current) => current ?? node.offsetTop);
    }
  }, []);

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

      /*
       * Sin la lista del mundo el nivel se juega igual, y la ventana sale sin
       * «Siguiente nivel»: no poder ofrecer el siguiente no es motivo para no
       * dejar jugar éste.
       */
      const [siblings, worlds, progress] = await Promise.all([
        worldsService.getLevelsByWorld(row.worldId),
        worldsService.getWorlds(),
        userId === null ? null : progressService.getMyProgress(userId),
      ]);

      if (!mounted) {
        return;
      }

      /*
       * EL CANDADO QUE CUENTA ES ÉSTE, no el de la lista: aquí llega también
       * quien escribe la dirección a mano. Si el progreso o la lista no se
       * pudieron leer se deja jugar, porque un corte de red no debe cerrarle a
       * un niño un nivel que quizá ya se ganó.
       */
      if (siblings.data !== null && progress !== null && progress.data !== null) {
        const completedIds = new Set(
          progress.data
            .filter((item) => item.completionStatus === 'completed')
            .map((item) => item.levelId)
        );

        if (justPassed.current) {
          completedIds.add(justPassed.current);
        }
        const blocker = blockingLevel(siblings.data, levelId, completedIds);

        if (blocker !== null) {
          setState({ status: 'locked', previousLevelName: blocker.name });
          return;
        }
      }

      /*
       * El mundo 1 es el PRIMERO DE LA LISTA ordenada, el mismo criterio que
       * da el color de cada mundo en sus pantallas. Si la lista falla, la caja
       * lleva «saltar»: sobrar un bloque no deja ningún nivel sin resolver.
       */
      const worldPosition = (worlds.data ?? []).findIndex((world) => world.id === row.worldId);

      setState({
        status: 'ready',
        title: row.name,
        instructions: row.narrative,
        level,
        nextLevelId: siblings.data === null ? null : nextLevelId(siblings.data, row.orderIndex),
        withJump: worldPosition !== 0,
        // PRUEBA DE ASSETS: el mundo 3 se queda sin relleno, como lo aprobó el usuario.
        fillGaps: worldPosition !== 2,
        // PRUEBA DE ASSETS: sólo «Dos caminos». Si se aprueba, será un campo del nivel.
        centerPillar: row.slug === 'dos-caminos',
      });
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [levelId, userId]);

  const backToLevels = () => navigate(`${ROUTES.WORLDS}/${worldId}`);
  const closeFinish = useCallback(() => setFinish(null), []);

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

  if (state.status === 'locked') {
    return (
      <div className="px-5 py-5">
        <section className="card p-6 text-center">
          <h1 className="title-lg">Este nivel todavía está cerrado</h1>
          <p className="subtitle mx-auto mt-2 max-w-[520px]">
            Supera «{state.previousLevelName}» y se abrirá.
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
            key={attemptKey}
            level={state.level.config}
            program={program}
            controlsHost={controlsHost}
            messageHost={messageHost}
            onHaltedChange={setHalted}
            onFinish={handleFinish}
            freeHeight={trayTop}
            centerPillar={state.centerPillar}
            islands
            fillGaps={state.fillGaps}
          />

          {/*
           * Justo debajo de «Vista inicial», que la escena pinta en la esquina.
           * Abierta o cerrada es EL MISMO botón: se toca para abrirla y se toca
           * para cerrarla, sin una ✕ pequeña que haya que encontrar.
           */}
          <button
            type="button"
            onClick={() => setHelpOpen((open) => !open)}
            aria-expanded={helpOpen}
            className={`absolute left-4 top-[72px] z-20 text-left shadow-[0_6px_18px_rgba(42,27,69,0.28)] transition-transform hover:-translate-y-[1px] ${
              helpOpen
                ? 'w-[340px] max-w-[calc(100%-2rem)] rounded-[24px] bg-mist px-5 pb-5 pt-4'
                : 'flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white'
            }`}
          >
            {helpOpen ? (
              <>
                <span className="flex items-center gap-2.5">
                  <NoteIcon />
                  <span className="font-display text-[18px] text-grape-dark">Instrucciones</span>
                </span>

                {/*
                 * Lo que hay que hacer sale de la NARRATIVA DE LA FILA, no escrito
                 * aquí: cambiar lo que se le pide al niño es cambiar un dato del
                 * nivel, no publicar la aplicación otra vez.
                 */}
                <span className="mt-2.5 block text-[15px] font-semibold leading-[1.6] text-ink-soft">
                  {state.instructions}
                </span>
              </>
            ) : (
              <>
                <HelpIcon />
                <span className="sr-only">Ver las instrucciones</span>
              </>
            )}
          </button>

          <div
            ref={measureTray}
            className="bandeja-de-bloques absolute inset-x-4 bottom-4 rounded-[24px] bg-mist shadow-[0_10px_28px_rgba(42,27,69,0.16)] backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 px-4 pb-1 pt-2.5">
              <BlocksIcon />
              <h2 className="shrink-0 font-display text-[18px] text-grape-dark">Bloques</h2>

              {/* El hueco del mensaje, que lo pinta la escena con un portal. */}
              <div ref={setMessageHost} className="min-w-0" />

              <button
                type="button"
                onClick={() => setTrayOpen((open) => !open)}
                className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-grape-dark transition-colors hover:bg-mist-soft"
                aria-expanded={trayOpen}
              >
                <ChevronIcon up={!trayOpen} />
                <span className="sr-only">
                  {trayOpen ? 'Plegar los bloques' : 'Abrir los bloques'}
                </span>
              </button>
            </div>

            {/*
             * Se pliega el MARCO y no el hueco: la caja coloca sus bloques con
             * el alto del hueco, y un hueco a cero los dejaría encimados al
             * volver a abrir.
             */}
            <div
              style={{ height: trayOpen ? undefined : 0 }}
              className={`overflow-hidden px-2 ${trayOpen ? 'pb-2' : ''}`}
            >
              <div className="relative rounded-[18px] bg-mist-soft">
                <div ref={setBlockBox} className="relative h-[104px] w-full" />

                {halted && <HaltedLock />}
              </div>
            </div>
          </div>
        </div>

        <div className="columna-del-lienzo relative flex min-h-0 flex-col rounded-[24px] bg-mist px-4 pb-4 pt-3.5 shadow-[0_8px_24px_rgba(42,27,69,0.12)]">
          <div className="flex items-center gap-2.5">
            <CanvasIcon />
            <h2 className="font-display text-[18px] text-grape-dark">Lienzo</h2>
          </div>

          <div className="marco-del-lienzo relative mt-2.5 min-h-0 w-full flex-1 overflow-hidden">
            <span className="pointer-events-none absolute inset-y-0 left-0 right-6 rounded-[18px] border-2 border-dashed border-mist-line bg-mist-soft" />

            {emptyCanvas && (
              <p className="pointer-events-none absolute inset-y-0 left-0 right-6 flex items-center justify-center px-4 text-center font-display text-[15px] text-ink-faint">
                Aquí verás la secuencia de bloques que crees.
              </p>
            )}

            {blockBox !== null && (
              <BlockEditorLoader
                onProgramChange={handleProgramChange}
                flyoutHost={blockBox}
                starterWorkspace={state.level.workspace}
                withJump={state.withJump}
              />
            )}

            {halted && <HaltedLock />}
          </div>

          {/* El hueco de los tres botones, que los pinta la escena con un portal. */}
          <div ref={setControlsHost} className="mt-3.5" />
        </div>
      </section>

      {finish !== null && (
        <LevelCompleteDialog
          steps={finish.steps}
          optimalSteps={finish.optimalSteps}
          score={scoreForSteps(finish.steps, finish.optimalSteps)}
          outcome={outcome}
          saveFailed={saveFailed}
          onExit={backToLevels}
          onNext={
            state.nextLevelId === null
              ? undefined
              : () =>
                  navigate(`${ROUTES.WORLDS}/${worldId}/${state.nextLevelId}`, {
                    state: { passedLevelId: levelId },
                  })
          }
          onRetry={() => {
            setFinish(null);
            setAttemptKey((key) => key + 1);
          }}
          onClose={closeFinish}
        />
      )}

      {/*
       * FUERA del diálogo a propósito: un logro se puede ganar en una partida
       * que NO superó el nivel —los de racha y los de historial no dependen del
       * éxito— y ahí el diálogo no se monta. Colgarlo de él habría dejado esos
       * avisos sin enseñar sin que nada lo delate.
       */}
      <AchievementToast
        unlocked={outcome?.unlockedAchievements ?? EMPTY_UNLOCKED}
        completedMissions={outcome?.completedMissions ?? EMPTY_MISSIONS}
      />
    </div>
  );
};
