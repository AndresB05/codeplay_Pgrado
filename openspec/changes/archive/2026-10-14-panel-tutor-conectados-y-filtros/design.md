## Context

- **Presencia:** `ClassroomsProvider` abre en la raíz un canal de presencia por
  salón (`watchClassroomPresence`) y publica `onlineStudentIds` en
  `useClassrooms()`. Para el tutor junta **todos sus salones** a la vez y él no
  se anuncia (`track` sólo para el niño). Ya lo usa `StudentRosterTable` para el
  punto verde. Así que el dato de «conectados» ya existe en el store para las dos
  pantallas del tutor, y **el store no cambia**.
- **«Activos hoy»:** `getClassGroupStats` (`classroomsData.ts`) cuenta a quien
  tiene `hoursSinceLastActivity <= 24`. Lo pintan `TeacherGroupDetailModule`
  (tarjeta «Activos hoy») y `TeacherGroupsModule` (tarjeta de resumen sumando
  salones, y el chip «Activos» de cada salón). `StudentClassroomModule` también
  llama a `getClassGroupStats` pero no pinta ese campo.
- **Tabla de seguimiento:** `StudentRosterTable` (en `shared/`), la misma para el
  tutor y para el niño; el tutor es quien pasa `onRemoveStudent`. Ya tiene un
  selector de orden propio.
- **«Quién ha cumplido»:** tabla dentro de `TeacherPanelModule`, explorador ×
  misión, sólo con un salón elegido. `TeacherPanelModule` recibe los `groups`
  por props.

## Goals / Non-Goals

**Goals:**
- Contar conectados en vez de activos del día, en vivo.
- Los filtros que eligió el usuario, en las dos tablas del tutor.

**Non-Goals:**
- Más filtros, filtros en la vista del niño, o guardar los filtros entre visitas.
- Tocar `ClassroomsProvider`: la frontera de `useClassrooms()` se respeta
  leyendo de ella, sin cambiarla.

## Decisions

### D1. Las estadísticas reciben a los conectados

`getClassGroupStats(group, onlineIds)` gana un segundo parámetro, por defecto un
conjunto vacío, y el campo `activeToday` se sustituye por `connectedNow`: los
alumnos de `group.students` cuyo id está en `onlineIds`. Se cuenta sobre los
alumnos del salón y no sobre el conjunto entero, porque para el tutor el
conjunto mezcla todos sus salones. Un niño está en un solo salón, así que sumar
salones en la lista no cuenta a nadie dos veces.

Los rótulos: «Conectados ahora» en las tarjetas y «Conectados» en el chip de cada
salón. `hoursSinceLastActivity` se queda: sigue dando la columna «Última
actividad».

Que la cifra cambie en vivo sale gratis: `onlineStudentIds` es estado del store y
las dos pantallas se repintan al cambiar.

### D2. Una función pura para filtrar

`shared/rosterFilters.ts`, con pruebas:

- `RosterFilters = { name: string; world: string | null; activity: 'all' | 'online' | 'offline' }`,
  donde `world` es el nombre del mundo, `NO_WORLD` para «Sin empezar» o `null`
  para todos.
- `filterRoster(students, filters, onlineIds)` — combina los tres con «y».
  El nombre se compara **sin mayúsculas ni tildes** (`normalize('NFD')` y quitar
  las marcas): «sofia» encuentra a «Sofía».
- `worldOptions(students)` — los mundos que aparecen en la tabla, ordenados, más
  «Sin empezar» si alguien no ha jugado. Salen de la tabla y no del catálogo,
  para no ofrecer un mundo que la deje vacía, como ya hacen los filtros de la
  lista de mundos del niño.

### D3. Una barra de filtros reutilizable

`shared/RosterFilterBar.tsx`: buscador, selector de mundo y selector de
actividad, con los mismos `field` y `field-label` que los filtros de
`StudentWorldsModule`. Acepta selectores extra como hijos, que es por donde
`TeacherPanelModule` mete el de estado. Sin filtros activos no enseña «Quitar
filtros»; con alguno, sí.

### D4. Dónde viven los filtros

- **Tabla de seguimiento:** el estado de los filtros vive **dentro** de
  `StudentRosterTable`, y la barra se pinta **sólo si llega `onRemoveStudent`**,
  que es la marca que ya separa la vista del tutor. Se filtra antes de ordenar,
  así el orden elegido se mantiene. Con cero filas por culpa de los filtros, un
  mensaje y «Quitar filtros»; el `emptyLabel` de hoy sigue siendo para el salón
  sin alumnos.
- **«Quién ha cumplido»:** el estado vive en `TeacherPanelModule`, junto a la
  tabla. El estado de cada fila se calcula con `completedPairs`, que ya existe:
  **cumplida** si tiene todas las misiones asignadas, **pendiente** si le falta
  alguna. Los filtros se vacían al cambiar de salón. Los conectados salen de
  `useClassrooms().onlineStudentIds`.

### D5. Por qué el estado es por fila y no por misión

La tabla tiene una columna por misión. Un filtro «cumplida» por misión pediría
elegir también la misión, y eso es un filtro más de los que el usuario pidió. Por
fila es lo que se lee de un vistazo: quién ha terminado y quién va retrasado.

## Risks / Trade-offs

- **La presencia tarda un instante en llegar** al abrir la pantalla: hasta
  entonces «Conectados ahora» dice 0. Es lo mismo que ya le pasa al punto verde.
- **`activeToday` desaparece del tipo.** Los tests de `getClassGroupStats` que lo
  comprueban se reescriben para `connectedNow`.
- **El filtro por mundo usa el nombre** que pinta la tabla, no un id: si dos
  mundos se llamaran igual se mezclarían. Hoy los tres nombres son distintos.
