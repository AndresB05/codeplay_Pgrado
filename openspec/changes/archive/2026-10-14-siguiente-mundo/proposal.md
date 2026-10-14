## Why

En la prueba preliminar del 25-sep-2026, al superar el último nivel de un mundo,
la ventana de felicitaciones sólo dejaba salir: el niño tenía que volver a la
lista de mundos y abrir el siguiente a mano. Y los mundos no tenían candado: un
niño podía entrar en el tercero sin la base de los anteriores y frustrarse. El
usuario decidió el 14-oct-2026 cerrar los mundos, y el botón tiene que cuadrar
con ese candado.

## What Changes

- **Candado de mundos.** El primer mundo está siempre abierto; cada uno de los
  demás se abre al superar **todos** los niveles del anterior. Los mundos sin
  niveles se saltan. Un mundo en el que el niño ya superó algún nivel sigue
  abierto para él. Se aplica en la lista de mundos, en la de niveles y en la
  pantalla de nivel, también al escribir la dirección.
- **«Siguiente mundo».** En el último nivel de un mundo, la ventana ofrece ir
  directamente al primer nivel del mundo siguiente, si está abierto. En el
  último del último mundo no sale.
- **Misiones de un mundo cerrado.** El tutor puede asignarlas igual; la tarjeta
  del niño le dice qué mundo tiene que superar antes.
- Sólo en el cliente, como el candado de niveles.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `contenido-mundos`: los mundos se abren en orden.
- `juego-3d`: la ventana de felicitaciones del último nivel de un mundo ofrece
  «Siguiente mundo».
- `misiones-asignadas`: la tarjeta de una misión de un mundo cerrado avisa de qué
  falta.

## Impact

- Nuevos: `apps/web/src/components/dashboard/student/worldLock.ts` y
  `worldLock.test.ts`; `apps/web/src/hooks/useWorldLocks.ts`.
- `apps/web/src/services/worlds.service.ts` — `getLevelsByWorlds`.
- `apps/web/src/components/dashboard/student/StudentWorldsModule.tsx`,
  `StudentWorldLevelsModule.tsx`, `StudentLevelModule.tsx`,
  `LevelCompleteDialog.tsx`, `nextLevel.ts` y `nextLevel.test.ts`.
- `apps/web/src/components/dashboard/shared/AssignedMissionsPanel.tsx`.
- **No toca Supabase:** ni esquema ni datos, no hace falta `db push`.
