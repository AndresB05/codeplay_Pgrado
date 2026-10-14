## 1. El candado, puro (`components/dashboard/student/worldLock.ts`)

- [x] 1.1 `blockingWorld` según D1, con `worldLock.test.ts`: primer mundo abierto, mundo anterior entero superado, falta un nivel, mundo vacío en medio, excepción por nivel ya superado, mundo desconocido, lista desordenada; `npm run test:run` pasa.
- [x] 1.2 `missionWorldOrder` con pruebas: `clear_world_2` → 2, `flawless_3` → `null`, claves mal formadas → `null`.

## 2. Lectura (`services/worlds.service.ts`, `hooks/useWorldLocks.ts`)

- [x] 2.1 `getLevelsByWorlds(worldIds)` en una consulta, agrupado por mundo, con `{ data, error }`.
- [x] 2.2 `useWorldLocks(userId)` → `blockerOf(worldId)`, abierto mientras carga y ante cualquier fallo.

## 3. Dónde se aplica

- [x] 3.1 `StudentWorldsModule.tsx`: tarjeta cerrada con «Primero supera …» y sin navegar. Verificar en navegador con la cuenta de prueba.
- [x] 3.2 `StudentWorldLevelsModule.tsx`: con el mundo cerrado, aviso y «Volver a mundos» en vez de la lista. Verificar escribiendo la dirección.
- [x] 3.3 `StudentLevelModule.tsx`: candado de mundo antes que el de niveles, con `justPassed`; el estado `locked` dice mundo o nivel. Verificar escribiendo la dirección de un nivel de un mundo cerrado.
- [x] 3.4 `AssignedMissionsPanel.tsx`: pie «Primero supera … para poder cumplirla» en la misión de un mundo cerrado. Verificar con una misión asignada, o con pruebas si la cuenta no tiene ninguna.

## 4. «Siguiente mundo»

- [x] 4.1 `nextLevel.ts`: `worldsAfter(worlds, worldId)` con pruebas (orden, desorden, huecos, último mundo, desconocido).
- [x] 4.2 `StudentLevelModule.tsx`: `nextWorldLevel` en el estado `ready` según D4, contando el nivel recién superado.
- [x] 4.3 `LevelCompleteDialog.tsx`: `onNextWorld?` y el botón; el módulo navega con `passedLevelId`. Verificar en navegador: último nivel del mundo 1 → primer nivel del mundo 2 abierto; nivel intermedio → «Siguiente nivel»; último del último mundo → ninguno.

## 5. Cierre

- [x] 5.1 `docs/CONTEXT.md`: candado de mundos, botón y aviso de misión, con rutas reales.
- [x] 5.2 `npm run lint`, `npm run test:run` y `npm run build` pasan; `npx openspec validate siguiente-mundo --strict` pasa.
