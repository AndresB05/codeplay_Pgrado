import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import leoExplains from '../../../assets/brand/leo-explains.webp';
import { ROUTES } from '../../../constants/routes';
import { BlockEditorLoader } from '../../../game/BlockEditorLoader';
import type { LevelFinish } from '../../../game/GameScene';
import { GameSceneLoader } from '../../../game/GameSceneLoader';
import { useAuth } from '../../../hooks/useAuth';
import { useMinWidth } from '../../../hooks/useMinWidth';
import { openLevel, type PlayableLevel } from '../../../game/levelConfig';
import type { Program } from '../../../game/program';
import { scoreForSteps } from '../../../game/score';
import { profileService } from '../../../services/profile.service';
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
import { nextLevelId, worldsAfter } from './nextLevel';
import { blockingWorld } from './worldLock';
import { submitAttempt } from './submitAttempt';
import { LoadingLeo } from '../../ui/LoadingLeo';
import { BackSign } from './BackSign';
import { WorldIntro } from './WorldIntro';

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

/*
 * Copia de la de `GameScene`, que no se puede importar: está tras la frontera
 * diferida y traerla de allí metería `three` en el paquete principal.
 */
const StepsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="8" cy="8.5" rx="3.2" ry="4.6" fill="currentColor" />
    <ellipse cx="15.5" cy="15" rx="3.2" ry="4.6" fill="currentColor" opacity="0.6" />
  </svg>
);

/*
 * Lo que Leo cuenta al entrar al mundo 3, que es el único con máximo de pasos.
 * La segunda burbuja enseña el contador con el máximo DE ESTE NIVEL, con el
 * aspecto del real, porque el real queda detrás del velo.
 */
const stepWorldBubbles = (stepLimit: number) => [
  '¡Hola! En este mundo los pasos están contados.',
  <>
    Mira arriba, a la derecha del tablero. Te dice cuántos te quedan.
    <span className="mt-3 flex w-fit items-center gap-2.5 rounded-full bg-ink px-4 py-2 font-display text-[17px] text-white">
      <StepsIcon />
      Pasos restantes: {stepLimit}
    </span>
  </>,
  'Si se acaban antes de la meta, toca empezar otra vez. ¡Busca el camino más corto!',
];

/* Los mundos 1 y 2 no cuentan pasos: Leo explica cómo se mueve y cómo se salta. */
const FIRST_WORLD_BUBBLES = [
  '¡Hola! Aquí me guías con bloques: cada bloque es una cosa que hago.',
  'Arrastra «avanzar» y «girar» y ponlos en orden, de arriba abajo.',
  'Pulsa «Ejecutar» y mira si llego a la meta. Si no, cambia el orden y prueba otra vez.',
];

const SECOND_WORLD_BUBBLES = [
  'Aquí el camino sube: hay escalones y huecos.',
  'Con «saltar» subo un escalón o cruzo un hueco.',
  'Parte el camino en tramos: primero hasta la primera roca, luego la siguiente.',
];

/*
 * Lo que Leo cuenta en cada mundo, por su lugar en la lista. Un nivel del
 * mundo 3 sin límite de pasos, o un mundo que no se pudo situar, se queda sin
 * explicación: no hay nada cierto que decirle al niño.
 */
const worldBubbles = (worldPosition: number, stepLimit: number | null) => {
  if (worldPosition === 0) {
    return FIRST_WORLD_BUBBLES;
  }

  if (worldPosition === 1) {
    return SECOND_WORLD_BUBBLES;
  }

  return worldPosition === 2 && stepLimit !== null ? stepWorldBubbles(stepLimit) : null;
};

/* Enteras y no armadas con el índice: Tailwind sólo conserva las clases que lee tal cual. */
const HOWTO_SIGNS = ['howto-sign-1', 'howto-sign-2', 'howto-sign-3'];

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
  | { status: 'locked'; kind: 'world' | 'level'; blockerName: string }
  | {
      status: 'ready';
      title: string;
      instructions: string;
      level: PlayableLevel;
      worldId: string;
      /* El lugar del mundo en la lista (0, 1, 2): elige el letrero de ayuda. */
      worldPosition: number;
      /* Sólo en el mundo de los pasos contados. */
      stepLimit: number | null;
      nextLevelId: string | null;
      /* El primer nivel del mundo siguiente, sólo en el último nivel y si está abierto. */
      nextWorldLevel: { worldId: string; levelId: string } | null;
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
type LevelTab = 'blocks' | 'board';

const LEVEL_TABS: { key: LevelTab; label: string }[] = [
  { key: 'blocks', label: 'Bloques' },
  { key: 'board', label: 'Tablero' },
];

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

  /*
   * EL HUECO DE LA CAJA ES UN NODO FIJO que se cuelga donde toque. La bandeja
   * cambia de sitio al cruzar `lg` (girar una tableta), y con un hueco nuevo el
   * editor se montaba otra vez y el niño perdía los bloques del lienzo.
   */
  const [blockBox] = useState(() => {
    const host = document.createElement('div');
    host.className = 'relative h-full w-full touch-none';
    return host;
  });
  const placeBlockBox = useCallback(
    (slot: HTMLDivElement | null) => {
      slot?.appendChild(blockBox);
    },
    [blockBox]
  );
  const [controlsHost, setControlsHost] = useState<HTMLDivElement | null>(null);
  const [messageHost, setMessageHost] = useState<HTMLDivElement | null>(null);

  const [trayOpen, setTrayOpen] = useState(true);

  /*
   * Por debajo de `lg` el juego no cabe en dos columnas: escena y lienzo pasan a
   * dos pestañas que llenan el alto que queda.
   */
  const compact = !useMinWidth(1024);
  const [mobileTab, setMobileTab] = useState<LevelTab>('blocks');

  /*
   * «Ejecutar» lleva al tablero. Los botones los pinta la escena por un portal y
   * sus eventos de React suben por la escena, no por aquí: se escucha el clic
   * nativo en el hueco, que sí es de esta pantalla.
   */
  useEffect(() => {
    if (!compact || controlsHost === null) {
      return undefined;
    }

    const showBoard = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest('.wood-key-go')) {
        setMobileTab('board');
      }
    };

    controlsHost.addEventListener('click', showBoard);

    return () => controlsHost.removeEventListener('click', showBoard);
  }, [compact, controlsHost]);

  const [helpOpen, setHelpOpen] = useState(false);

  const [introOpen, setIntroOpen] = useState(false);

  const [halted, setHalted] = useState(false);

  /*
   * Las dos órdenes que cruzan de un lado al otro de la pantalla: «Limpiar»,
   * que confirma la escena y vacía el editor, y «Cambiar los bloques», que pide
   * el bloqueo y devuelve al personaje. Son contadores porque lo que baja por
   * la frontera diferida son datos.
   */
  const [clearSignal, setClearSignal] = useState(0);
  const [restartSignal, setRestartSignal] = useState(0);
  const requestClear = useCallback(() => setClearSignal((signal) => signal + 1), []);
  const requestRestart = useCallback(() => setRestartSignal((signal) => signal + 1), []);
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

      const completedIds =
        progress === null || progress.data === null
          ? null
          : new Set(
              progress.data
                .filter((item) => item.completionStatus === 'completed')
                .map((item) => item.levelId)
            );

      if (completedIds !== null && justPassed.current) {
        completedIds.add(justPassed.current);
      }

      const levelsByWorld =
        worlds.data === null
          ? null
          : (await worldsService.getLevelsByWorlds(worlds.data.map((world) => world.id))).data;

      if (!mounted) {
        return;
      }

      /*
       * LOS CANDADOS QUE CUENTAN SON ÉSTOS, no los de las listas: aquí llega
       * también quien escribe la dirección a mano. El de mundo va primero, porque
       * en un mundo cerrado no importa qué nivel falta. Si algo no se pudo leer
       * se deja jugar, porque un corte de red no debe cerrarle a un niño un nivel
       * que quizá ya se ganó.
       */
      if (worlds.data !== null && levelsByWorld !== null && completedIds !== null) {
        const blocker = blockingWorld(worlds.data, levelsByWorld, row.worldId, completedIds);

        if (blocker !== null) {
          setState({ status: 'locked', kind: 'world', blockerName: blocker.name });
          return;
        }
      }

      if (siblings.data !== null && completedIds !== null) {
        const blocker = blockingLevel(siblings.data, levelId, completedIds);

        if (blocker !== null) {
          setState({ status: 'locked', kind: 'level', blockerName: blocker.name });
          return;
        }
      }

      const next = siblings.data === null ? null : nextLevelId(siblings.data, row.orderIndex);

      /*
       * EL MUNDO SIGUIENTE, sólo en el último nivel: el primero de orden mayor
       * que tenga niveles, y sólo si está abierto contando ESTE nivel como
       * superado —el botón sale al superarlo, y la partida puede no haberse
       * guardado—. Un niño con niveles sueltos de antes del candado puede llegar
       * aquí sin el resto del mundo, y ahí el botón llevaría a un mundo cerrado.
       */
      let nextWorldLevel: { worldId: string; levelId: string } | null = null;

      if (
        siblings.data !== null &&
        next === null &&
        worlds.data !== null &&
        levelsByWorld !== null &&
        completedIds !== null
      ) {
        const passed = new Set(completedIds).add(levelId);
        const target = worldsAfter(worlds.data, row.worldId).find(
          (world) => (levelsByWorld.get(world.id) ?? []).length > 0
        );
        const firstLevel =
          target === undefined ? null : nextLevelId(levelsByWorld.get(target.id) ?? [], -Infinity);

        if (
          target !== undefined &&
          firstLevel !== null &&
          blockingWorld(worlds.data, levelsByWorld, target.id, passed) === null
        ) {
          nextWorldLevel = { worldId: target.id, levelId: firstLevel };
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
        worldId: row.worldId,
        worldPosition,
        stepLimit: worldPosition === 2 ? (level.config.stepLimit ?? null) : null,
        nextLevelId: next,
        nextWorldLevel,
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

  const introBubbles =
    state.status === 'ready' ? worldBubbles(state.worldPosition, state.stepLimit) : null;
  const introWorldId = state.status === 'ready' && introBubbles !== null ? state.worldId : null;

  /*
   * Leo sale solo la primera vez, y quién lo vio se lee de la cuenta y no del
   * navegador: los equipos del aula son compartidos. Si la lectura falla no
   * sale, que el nivel se juega igual y el botón de la cabecera sigue ahí.
   */
  useEffect(() => {
    if (introWorldId === null || userId === null) {
      return;
    }

    let mounted = true;

    void profileService.getSeenWorldIntros(userId).then((result) => {
      if (mounted && result.data !== null && !result.data.includes(introWorldId)) {
        setIntroOpen(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [introWorldId, userId]);

  /*
   * Se anota AL CERRAR y no al abrir: preguntar «¿era la primera vez?» y anotar
   * en la misma llamada se rompe con el doble efecto de `React.StrictMode`. Si
   * falla, lo vuelve a ver la próxima vez, que es mejor que un aviso de error.
   */
  const closeIntro = useCallback(() => {
    setIntroOpen(false);

    if (introWorldId !== null && userId !== null) {
      void profileService.markWorldIntroSeen(introWorldId);
    }
  }, [introWorldId, userId]);

  const backToLevels = () => navigate(`${ROUTES.WORLDS}/${worldId}`);
  const closeFinish = useCallback(() => setFinish(null), []);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-[calc(100vh-84px)] items-center justify-center px-5 py-5">
        <LoadingLeo label="Cargando el nivel…" />
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

          <BackSign onClick={backToLevels} className="mt-5">
            Volver a los niveles
          </BackSign>
        </section>
      </div>
    );
  }

  if (state.status === 'locked') {
    const isWorld = state.kind === 'world';

    return (
      <div className="px-5 py-5">
        <section className="card p-6 text-center">
          <h1 className="title-lg">
            {isWorld ? 'Este mundo todavía está cerrado' : 'Este nivel todavía está cerrado'}
          </h1>
          <p className="subtitle mx-auto mt-2 max-w-[520px]">
            {isWorld
              ? `Primero supera ${state.blockerName}.`
              : `Supera «${state.blockerName}» y se abrirá.`}
          </p>

          <BackSign
            onClick={isWorld ? () => navigate(ROUTES.WORLDS) : backToLevels}
            className="mt-5"
          >
            {isWorld ? 'Volver a mundos' : 'Volver a los niveles'}
          </BackSign>
        </section>
      </div>
    );
  }

  const nextWorld = state.nextWorldLevel;

  // El sobre vacío es `{}`, así que esto distingue «no hay bloques» de «no ha llegado».
  const emptyCanvas = program === null || Object.keys(program.workspace).length === 0;

  /*
   * La bandeja de bloques: en el escritorio flota sobre el pie de la escena; en
   * el móvil va bajo el lienzo, en la misma pestaña, para arrastrar sin cruzar
   * de panel. El mensaje de la escena sale de ella en el móvil y va junto a los
   * botones, que se ven desde las dos pestañas.
   */
  const tray = (
    <div
      ref={compact ? undefined : measureTray}
      className={`bandeja-de-bloques passport-page ${
        compact
          ? 'relative shrink-0 [border-width:12px]'
          : 'absolute inset-x-4 bottom-4 [border-width:16px]'
      }`}
    >
      <div className={`flex items-center gap-3 px-1 ${compact ? 'hidden' : ''}`}>
        <BlocksIcon />
        <h2 className="shrink-0 font-display text-[18px] text-grape-dark">Bloques</h2>

        {/* El hueco del mensaje, que lo pinta la escena con un portal. */}
        {compact ? null : <div ref={setMessageHost} className="min-w-0" />}

        <button
          type="button"
          onClick={() => setTrayOpen((open) => !open)}
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-grape-dark transition-colors hover:bg-mist-soft"
          aria-expanded={trayOpen}
        >
          <ChevronIcon up={!trayOpen} />
          <span className="sr-only">{trayOpen ? 'Plegar los bloques' : 'Abrir los bloques'}</span>
        </button>
      </div>

      {/*
       * Se pliega el MARCO y no el hueco: la caja coloca sus bloques con
       * el alto del hueco, y un hueco a cero los dejaría encimados al
       * volver a abrir.
       */}
      <div style={{ height: trayOpen ? undefined : 0 }} className="overflow-hidden">
        <div className="relative">
          {/*
           * En el móvil, alto para dos filas: en una, los bloques no caben a un
           * tamaño que se pueda coger. El hueco lleva `touch-none`, como el lienzo
           * de Blockly: si no, el navegador se queda el gesto del dedo.
           */}
          <div
            ref={placeBlockBox}
            className={`relative w-full ${compact ? 'h-[96px]' : 'h-[72px]'}`}
          />

          {halted && <HaltedLock />}
        </div>
      </div>
    </div>
  );

  const panelHidden = (tab: LevelTab) =>
    compact && mobileTab !== tab ? 'invisible pointer-events-none' : '';

  return (
    <div className={compact ? 'level-compact-page flex flex-col px-5 py-2' : 'px-5 py-5'}>
      {/*
       * La cabecera es una tabla de madera, la misma de los logros: volver, el
       * nombre del nivel en una placa clara y la ayuda del mundo. En el móvil, una
       * sola fila: la flecha y la ayuda se quedan en icono.
       */}
      <section
        className={`wood-board flex items-center justify-between gap-3 ${
          compact ? 'h-[50px] shrink-0 flex-nowrap gap-2' : 'flex-wrap py-2'
        }`}
      >
        {compact ? (
          <button
            type="button"
            onClick={backToLevels}
            aria-label="Volver a los niveles"
            className="wood-key flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border-[3px] text-wood-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 5L8 12L15 19"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <BackSign onClick={backToLevels}>Volver a los niveles</BackSign>
        )}

        {/*
         * En el móvil las pestañas ocupan el sitio del título, que se queda para
         * el lector de pantalla: en una fila aparte se comían el alto del lienzo.
         */}
        {compact ? (
          <>
            <h1 className="sr-only">{state.title}</h1>
            <div
              role="tablist"
              aria-label="Vista del nivel"
              className="flex min-w-0 flex-1 gap-1.5"
            >
              {LEVEL_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  id={`level-tab-${tab.key}`}
                  aria-selected={mobileTab === tab.key}
                  aria-controls={`level-panel-${tab.key}`}
                  onClick={() => setMobileTab(tab.key)}
                  className={`h-9 min-w-0 flex-1 rounded-[12px] border-[3px] px-1 font-display text-[14px] ${
                    mobileTab === tab.key ? 'wood-key wood-key-current' : 'wood-key text-wood-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="wood-bare rounded-[12px] px-5 py-1.5">
            <h1 className="wood-deep text-center font-display text-[26px] leading-tight">
              {state.title}
            </h1>
          </div>
        )}

        {introBubbles !== null &&
          (compact ? (
            <button
              type="button"
              onClick={() => setIntroOpen(true)}
              aria-label="¿Cómo se juega aquí?"
              className="shrink-0 rounded-full border-2 border-wood-ink bg-cream"
            >
              <img
                src={leoExplains}
                alt=""
                className="h-9 w-9 rounded-full object-cover object-top"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIntroOpen(true)}
              className={`howto-sign ${HOWTO_SIGNS[state.worldPosition] ?? HOWTO_SIGNS[0]} wood-carved gap-2 font-display text-[16px]`}
            >
              <img
                src={leoExplains}
                alt=""
                className="h-8 w-8 rounded-full border-2 border-wood-ink bg-cream object-cover object-top"
              />
              ¿Cómo se juega aquí?
            </button>
          ))}
      </section>

      {/*
       * Alto fijo a propósito: la escena se ajusta a su padre y el lienzo
       * también, así que un padre sin altura los deja a los dos en cero. En el
       * móvil, el alto que queda en la pantalla, y las dos pestañas apiladas en él:
       * la oculta se esconde con `invisible` y no con `display: none`, que dejaría
       * en cero el lienzo de la escena y el de Blockly.
       */}
      <section
        className={`marco-del-juego ${
          compact
            ? 'relative mt-2 min-h-[200px] flex-1'
            : 'mt-5 grid h-[640px] gap-4 lg:grid-cols-[minmax(0,1fr)_340px]'
        }`}
      >
        {/* La escena, el lienzo y los bloques, en páginas del pasaporte, como el saludo de «Mundos». */}
        <div
          id="level-panel-board"
          role={compact ? 'tabpanel' : undefined}
          aria-labelledby={compact ? 'level-tab-board' : undefined}
          className={`zona-del-juego passport-frame overflow-hidden ${
            compact ? `absolute inset-0 ${panelHidden('board')}` : 'relative'
          }`}
        >
          <GameSceneLoader
            key={attemptKey}
            level={state.level.config}
            program={program}
            controlsHost={controlsHost}
            messageHost={messageHost}
            onHaltedChange={setHalted}
            onClear={requestClear}
            restartSignal={restartSignal}
            onFinish={handleFinish}
            freeHeight={compact ? null : trayTop}
            quietWhenIdle={compact}
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
            className={`absolute left-4 top-[72px] z-20 text-left ${
              helpOpen
                ? 'passport-paper w-[340px] max-w-[calc(100%-2rem)] rounded-[24px] px-5 pb-5 pt-4 shadow-[0_6px_18px_rgba(42,27,69,0.28)] transition-transform hover:-translate-y-[1px]'
                : 'wood-key flex h-11 w-11 items-center justify-center rounded-[14px] border-[3px] text-wood-ink'
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

          {compact ? null : tray}
        </div>

        <div
          id="level-panel-blocks"
          role={compact ? 'tabpanel' : undefined}
          aria-labelledby={compact ? 'level-tab-blocks' : undefined}
          className={`columna-del-lienzo passport-page flex min-h-0 flex-col ${
            compact
              ? `absolute inset-0 gap-1.5 px-0 [border-width:12px] ${panelHidden('blocks')}`
              : 'relative px-0.5 [border-width:30px]'
          }`}
        >
          {compact ? null : (
            <div className="flex items-center gap-2.5">
              <CanvasIcon />
              <h2 className="title-lg">Lienzo</h2>
            </div>
          )}

          <div
            className={`marco-del-lienzo relative w-full min-h-0 flex-1 overflow-hidden ${
              compact ? '' : 'mt-2.5'
            }`}
          >
            <span className="pointer-events-none absolute inset-y-0 left-0 right-6 rounded-[18px] border-2 border-dashed border-sepia-soft/40 bg-wood-bare/30" />

            {emptyCanvas && (
              <p className="pointer-events-none absolute inset-y-0 left-0 right-6 flex items-center justify-center px-4 text-center font-display text-[15px] text-sepia-soft">
                Aquí verás la secuencia de bloques que crees.
              </p>
            )}

            <BlockEditorLoader
              onProgramChange={handleProgramChange}
              flyoutHost={blockBox}
              starterWorkspace={state.level.workspace}
              withJump={state.withJump}
              clearSignal={clearSignal}
            />

            {halted && <HaltedLock onChangeBlocks={requestRestart} />}
          </div>

          {compact ? tray : null}

          {/* El hueco de los tres botones, que los pinta la escena con un portal. */}
          {compact ? null : <div ref={setControlsHost} className="mt-3.5" />}
        </div>
      </section>

      {/*
       * En el móvil, mensaje y botones bajo las dos pestañas: se ven desde las
       * dos, y «Ejecutar» lleva al tablero para ver moverse al personaje.
       */}
      {compact ? (
        <div className="mt-1.5 flex shrink-0 flex-col gap-1.5">
          <div ref={setMessageHost} className="rounded-[12px] bg-cream/90 px-3 py-1 empty:hidden" />
          <div ref={setControlsHost} />
        </div>
      ) : null}

      {introOpen && introBubbles !== null && (
        <WorldIntro image={leoExplains} bubbles={introBubbles} onClose={closeIntro} />
      )}

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
          onNextWorld={
            nextWorld === null
              ? undefined
              : () =>
                  navigate(`${ROUTES.WORLDS}/${nextWorld.worldId}/${nextWorld.levelId}`, {
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
