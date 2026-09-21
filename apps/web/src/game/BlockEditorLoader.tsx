import { lazy, Suspense } from 'react';
import type { Program, WorkspaceState } from './program';

/*
 * La segunda frontera del bundle, y existe por lo mismo que `GameSceneLoader`:
 * aquí NO se importa Blockly. Entra sólo por el `import()` de abajo, así que
 * viaja en su propio trozo y quien no abra una pantalla con editor no lo
 * descarga. Importar el editor de forma estática desde aquí anula el cambio
 * entero.
 *
 * `program.ts` sí se importa —y sólo su tipo—: no arrastra Blockly, y el tipo
 * desaparece al compilar.
 */
const LazyBlockEditor = lazy(() =>
  import('./BlockEditor').then((module) => ({ default: module.BlockEditor })),
);

interface BlockEditorLoaderProps {
  onProgramChange: (program: Program) => void;
  /* El hueco de la caja de bloques. Cruza la frontera como dato, igual que el programa. */
  flyoutHost: HTMLElement;
  /* Con qué bloques arranca el lienzo. Lo saca del sobre quien lee el nivel. */
  starterWorkspace: WorkspaceState;
  /* Si la caja ofrece «saltar»: el mundo 1 no lo lleva. */
  withJump: boolean;
}

export const BlockEditorLoader = ({
  onProgramChange,
  flyoutHost,
  starterWorkspace,
  withJump,
}: BlockEditorLoaderProps) => (
  <Suspense
    fallback={
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-[5px] border-line border-t-grape" />
        <span className="sr-only">Cargando los bloques…</span>
      </div>
    }
  >
    <LazyBlockEditor
      onProgramChange={onProgramChange}
      flyoutHost={flyoutHost}
      starterWorkspace={starterWorkspace}
      withJump={withJump}
    />
  </Suspense>
);
