## Context

`StudentLevelModule.tsx` ya carga al abrir un nivel la lista de niveles de su
mundo, **la de mundos** (`worldsService.getWorlds`, ordenada por `sort_order`) y
el progreso del niño. Con la de niveles calcula `nextLevelId`, y si sale `null`
—último nivel— `LevelCompleteDialog` no pinta «Siguiente nivel».

**Lo que hay hoy de candados**, comprobado en el código:

- **Niveles:** `blockingLevel` (`levelLock.ts`). El primer nivel de cada mundo
  está siempre abierto; los demás, al superar el anterior. Se aplica en la lista
  (`StudentWorldLevelsModule`, sólo lo que se ve) y **de verdad** en
  `StudentLevelModule`, que es donde llega la dirección escrita a mano. Si el
  progreso o la lista no se leen, deja jugar. Sólo en el cliente.
- **La carrera del guardado:** «Siguiente nivel» navega con `passedLevelId` en
  el estado, y la pantalla de nivel lo cuenta como superado (`justPassed`), porque
  la partida puede no haberse guardado todavía.
- **Mundos:** ninguno. `StudentWorldsModule` navega siempre. El tipo
  `WorldStatus` con `'locked'` y el `WorldCard` de `components/dashboard/WorldCard/`
  existen pero nadie los importa.
- **Misiones:** `AssignedMissionsPanel` pinta tarjetas sin botón. Las de mundo se
  identifican por clave: `clear_world_N` es el mundo de orden N (lo fija la
  migración `202606030044_playable_missions.sql`).

## Goals / Non-Goals

**Goals:**
- Candado de mundos según la regla del usuario (spec `contenido-mundos`).
- «Siguiente mundo» en el último nivel, cuadrado con el candado.
- Aviso en la tarjeta de una misión de un mundo cerrado.

**Non-Goals:**
- Llevar el candado a la base. Ver D6.
- Rescatar el `WorldCard` huérfano: su estado `locked` no lo calcula nadie y
  pinta otra tarjeta distinta de la que se usa. Queda para otro cambio.
- Una pantalla de «mundo completado».

## Decisions

### D1. Una función pura junto a `levelLock.ts`

`worldLock.ts`, con sus pruebas en `worldLock.test.ts`:

- `blockingWorld(worlds, levelsByWorld, worldId, completedIds): World | null` —
  el mundo que hay que superar antes, o `null` si éste está abierto. Ordena por
  `orderIndex`, **descarta los mundos sin niveles**, y:
  - el primer mundo con niveles → abierto;
  - un mundo con algún nivel suyo en `completedIds` → abierto (la excepción);
  - si no, abierto sólo si **todos** los niveles del anterior con niveles están
    en `completedIds`; si no, devuelve ese anterior.
  - Un mundo que no está en la lista, o sin niveles → abierto: sin saber qué va
    delante, cerrarlo dejaría al niño sin salida. Mismo criterio que
    `blockingLevel`.
- `missionWorldOrder(missionKey): number | null` — el `N` de `clear_world_N`.

La regla mira **sólo el mundo anterior**, como pidió el usuario: con la
excepción, un niño puede tener abierto el 3 sin haber terminado el 2, y el 4 se
abriría al superar el 3 entero. No se encadena hacia atrás.

### D2. Cómo se leen los niveles de todos los mundos

`worldsService.getLevelsByWorlds(worldIds)`: **una sola consulta** con `in`,
agrupada por mundo, con el `{ data, error }` de siempre. Hoy
`StudentWorldsModule` hace una consulta por mundo para contar; no se toca, pero
el candado no multiplica peticiones.

Encima, un hook `useWorldLocks(userId)` que junta mundos, niveles y progreso y
devuelve `blockerOf(worldId): World | null`, los mundos leídos —para que las
misiones encuentren el de orden N— y `loading`, con el que la pantalla de
niveles espera antes de enseñar la lista. **Cualquier fallo, o mientras carga,
deja todo abierto**, con el mismo motivo que el candado de niveles. Lo usan las
pantallas que no cargan ya todo eso por su cuenta.

### D3. Dónde se aplica

| Sitio | Cómo |
| --- | --- |
| Lista de mundos (`StudentWorldsModule.tsx`, su `WorldCard` local) | `useWorldLocks`. La tarjeta cerrada se pinta con candado, «Primero supera …» y no navega (`disabled`). |
| Niveles de un mundo (`StudentWorldLevelsModule.tsx`) | `useWorldLocks`. Un mundo cerrado enseña un aviso con el mundo a superar y «Volver a mundos», como hoy el estado `missing`; no la lista. |
| Pantalla de nivel (`StudentLevelModule.tsx`) | **El candado que cuenta**, como con los niveles. En su `load` ya tiene mundos y progreso; añade `getLevelsByWorlds` al `Promise.all`. Va **antes** que el de niveles, y suma `justPassed` a los superados. El estado `locked` pasa a llevar qué hay que superar y si es un mundo o un nivel. |
| Tarjeta de misión (`AssignedMissionsPanel.tsx`) | `useWorldLocks` + `missionWorldOrder`. Con el mundo cerrado, el pie dice «Primero supera …» en vez de «Se cumple jugando los niveles». |

### D4. «Siguiente mundo»

Sale en el último nivel de un mundo, con el nivel superado —la ventana sólo se
abre así—, si hay mundo siguiente con niveles **y está abierto** según
`blockingWorld` **contando el nivel recién superado**. En el último nivel del
último mundo no sale. Si alguna lectura falla, no sale: un botón que no sabe a
dónde va no se pinta, que es lo que ya hace «Siguiente nivel».

El mundo siguiente se calcula en el `load` de `StudentLevelModule`, sólo si es el
último nivel, con los datos de D3 —ya los tiene, no hay petición extra—. El
estado `ready` gana `nextWorldLevel: { worldId, levelId } | null`.

`LevelCompleteDialog` recibe `onNextWorld?` y pinta «Siguiente mundo»
(`btn btn-mint`) en el sitio de «Siguiente nivel». Nunca llegan los dos.

Navega **con** `passedLevelId`, a diferencia de lo que decía la primera versión
de esta propuesta: ahora el primer nivel del mundo siguiente sí puede salir
cerrado —por el candado de mundos— si la partida que lo abre no se ha guardado.

### D5. Textos

- Tarjeta de mundo y pantallas cerradas: «Primero supera <mundo>.»
- Tarjeta de misión: «Primero supera <mundo> para poder cumplirla.»

### D6. Sólo en el cliente

Como el candado de niveles. Lo que protege es el recorrido del niño, no un
secreto: quien se salte el cliente juega un nivel que de todas formas puede leer
—la RLS le deja leer todos los publicados—, y el servidor guarda la partida
igual que hoy guarda la de un nivel cerrado. **No hay razón de peso para una
migración**, y una migración pediría `db push` al usuario.

## Risks / Trade-offs

- **Parsear `clear_world_N` en el cliente.** El spec de misiones dice que el
  cliente no nombra misiones; esto no nombra ninguna, lee la convención de la
  clave que la migración deja escrita. Si un día se añade otra misión de mundo
  con otra forma de clave, no llevará aviso hasta que se enseñe aquí. La
  alternativa limpia —una columna `world_order` en `mission_catalog`— pide
  migración y `db push`.
- **La lista de mundos parpadea abierta** mientras carga el candado (abierto por
  defecto). Pulsar en ese instante lleva a la pantalla de niveles, que lo
  vuelve a comprobar y lo para.
- **Las tres pantallas leen lo mismo por separado.** Son lecturas pequeñas; un
  store compartido sería otro cambio.
