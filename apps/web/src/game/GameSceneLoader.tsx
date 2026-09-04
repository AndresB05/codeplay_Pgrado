import { lazy, Suspense } from 'react';

/*
 * La frontera del bundle, y el motivo de que este archivo exista aparte de la
 * escena: aquí NO se importa `three` ni `@react-three/fiber`. El motor 3D entra
 * sólo por el `import()` de abajo, así que viaja en su propio trozo y quien no
 * abra una pantalla con juego no lo descarga. Importar la escena de forma
 * estática desde aquí anula el cambio entero.
 *
 * El `.then` traduce la exportación con nombre a la exportación por defecto que
 * `lazy` exige, para no abrir la primera excepción a la convención del repo.
 */
const LazyGameScene = lazy(() =>
  import('./GameScene').then((module) => ({ default: module.GameScene })),
);

export const GameSceneLoader = () => (
  <Suspense
    fallback={
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-[5px] border-line border-t-grape" />
        <span className="sr-only">Cargando el juego…</span>
      </div>
    }
  >
    <LazyGameScene />
  </Suspense>
);
