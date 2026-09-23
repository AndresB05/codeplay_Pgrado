import { Component, lazy, Suspense, type ReactNode } from 'react';
import type { LevelFinish } from './GameScene';
import type { LevelConfig } from './level';
import type { Program } from './program';

/*
 * La frontera del bundle, y el motivo de que este archivo exista aparte de la
 * escena: aquí NO se importa `three` ni `@react-three/fiber`. El motor 3D entra
 * sólo por el `import()` de abajo, así que viaja en su propio trozo y quien no
 * abra una pantalla con juego no lo descarga. Importar la escena de forma
 * estática desde aquí anula el cambio entero.
 *
 * Tampoco se importa el intérprete: el programa cruza como DATO y quien lo
 * ejecuta vive al otro lado. `program.ts` y `level.ts` sí se importan —y sólo
 * sus tipos—: no arrastran nada, y los tipos desaparecen al compilar. El nivel
 * viene YA COMPROBADO de arriba: quien lo rechaza es el anfitrión (§7), así que
 * de este lado no hay ninguna rama de error que mantener.
 *
 * El `.then` traduce la exportación con nombre a la exportación por defecto que
 * `lazy` exige, para no abrir la primera excepción a la convención del repo.
 */
const LazyGameScene = lazy(() =>
  import('./GameScene').then((module) => ({ default: module.GameScene }))
);

/*
 * EL LÍMITE DE ERROR VA AQUÍ, ENCIMA DEL `<Canvas>`, y no puede ir más abajo:
 * fiber envuelve a sus hijos en su propio límite y VUELVE A LANZAR el error en
 * el render del `<Canvas>`, así que nada colocado dentro de la escena lo
 * atrapa. Medido con un modelo que no existe: sin este límite nadie para la
 * excepción y React desmonta el árbol ENTERO —`#root` se queda con cero hijos—,
 * así que se va la aplicación, no sólo el juego. Es la misma forma del fallo de
 * `hasLooseStacks` que dejó la pantalla en blanco en el J6.3.
 *
 * Es un componente de clase porque es la única forma que React da de declarar un
 * límite de error: la convención del repo son funciones, y ésta es la excepción
 * que impone la API, no una elección.
 *
 * Y vive de este lado de la frontera diferida sin romperla: un límite de error
 * no importa `three` ni la escena.
 */
interface SceneBoundaryProps {
  children: ReactNode;
}

class SceneBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) {
      return this.props.children;
    }

    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-6 text-center">
        <p className="font-display text-[17px] text-ink">No se ha podido dibujar el juego.</p>
        <p className="text-[14px] text-ink-soft">
          Vuelve a cargar la página para intentarlo otra vez.
        </p>
      </div>
    );
  }
}

interface GameSceneLoaderProps {
  /* El nivel que se juega, ya comprobado. Cruza como dato, igual que el programa. */
  level: LevelConfig;
  program: Program | null;
  /* El hueco de los tres botones. Cruza como dato, igual que el programa. */
  controlsHost: HTMLElement | null;
  /* Y el del mensaje, en la franja del lienzo. Cruza igual. */
  messageHost: HTMLElement | null;
  /* Los dos avisos hacia arriba: si está detenido y si llegó. Sólo datos. */
  onHaltedChange?: (halted: boolean) => void;
  onFinish?: (result: LevelFinish) => void;
  /* El alto que la bandeja deja libre, para el encuadre. */
  freeHeight?: number | null;
  centerPillar?: boolean;
  islands?: boolean;
  fillGaps?: boolean;
}

export const GameSceneLoader = ({
  level,
  program,
  controlsHost,
  messageHost,
  onHaltedChange,
  onFinish,
  freeHeight,
  centerPillar,
  islands,
  fillGaps,
}: GameSceneLoaderProps) => (
  <SceneBoundary>
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-[5px] border-line border-t-grape" />
          <span className="sr-only">Cargando el juego…</span>
        </div>
      }
    >
      <LazyGameScene
        level={level}
        program={program}
        controlsHost={controlsHost}
        messageHost={messageHost}
        onHaltedChange={onHaltedChange}
        onFinish={onFinish}
        freeHeight={freeHeight}
        centerPillar={centerPillar}
        islands={islands}
        fillGaps={fillGaps}
      />
    </Suspense>
  </SceneBoundary>
);
