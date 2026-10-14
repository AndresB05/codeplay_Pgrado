## Context

- **El selector de hoy** (`TeacherPanelModule.tsx`, bajo «Elige un explorador
  para ver cuánto le costó cada nivel.»): un botón-chip por explorador del
  alcance, en `flex-wrap`. Pulsar uno navega a `panelPath(grupo, alumno)`;
  pulsar el elegido lo quita. Con «Todos» el alcance junta los alumnos de todos
  los salones, así que la lista puede ser aún más larga que un salón.
- **El fondo del tutor** (`TeacherDashboard.tsx`): la página lleva
  `jungle-surface` —lavanda con resplandores y lunares— y `<main>` monta
  `<PanelBackdrop />`, la ilustración del valle con la cascada. El niño usa los
  mismos dos en `Dashboard.tsx`. `body` ya es `lavender`.
- **La comparación de nombres sin tildes** ya existe dentro de `rosterFilters.ts`
  (`fold`), sin exportar.

## Goals / Non-Goals

**Goals:**
- Encontrar a un explorador escribiendo, y que la lista no ocupe media pantalla.
- Fondo liso en todas las pantallas del tutor, sin tocar las del niño.

**Non-Goals:**
- Cambiar la ficha del explorador o lo que la dirección guarda.
- Rehacer las tarjetas o el tema: sólo se quita el adorno de debajo.

## Decisions

### D1. Buscador más lista acotada, no un combobox

`teacher/StudentPicker.tsx`:

- Un campo «Buscar explorador» (`field`) y, debajo, **los mismos chips de hoy**,
  filtrados, dentro de una caja de **`max-h` de unas tres filas con
  `overflow-y-auto`**.
- El elegido va **fijo encima de la caja**, como un chip con «✕» para quitarlo,
  y no depende de la búsqueda.
- Sin coincidencias: «Ningún explorador se llama así.»
- La búsqueda vive en el componente; el panel lo monta con el alcance como
  `key`, así que cambiar de salón la vacía, como hace ya la tabla de misiones.

**Por qué no un combobox** (campo con lista desplegable): para que sea usable con
teclado y lector de pantalla pide el patrón ARIA entero —`listbox`, opción
activa, flechas, Escape, foco que vuelve—, que el repo no tiene en ningún sitio y
habría que escribir y probar desde cero, o una dependencia nueva. Y esconde la
lista: el tutor que no recuerda el nombre exacto ya no ve a quién puede elegir.
**Por qué no un `<select>`**: el navegador sólo salta por la primera letra, no
busca dentro del nombre ni ignora tildes. La caja con chips es lo que ya hay,
acotado: se recorre con Tab, cada chip es un botón y se sigue viendo a todos.

### D2. Una sola regla de comparar nombres

Se exporta de `rosterFilters.ts` `matchesName(name, query)`, que es la misma
comparación que usa `filterRoster`. El buscador la usa; las tablas no cambian.

### D3. Fondo liso con `lavender`

En `TeacherDashboard.tsx` la raíz pasa de `jungle-surface` a `bg-lavender` y se
quita `<PanelBackdrop />` de `<main>`. **Lavanda** porque es el fondo de la
aplicación según la guía (§2.1) y lo que ya hay debajo de la trama: las tarjetas
blancas con contorno de tinta están pensadas sobre él. `jungle-surface` y
`PanelBackdrop` se quedan, porque los usa el niño y la portada.

Se comprueba en navegador que tarjetas, tablas y avisos se distinguen del fondo,
y se deja anotado en `docs/ESTADO-DEL-PROYECTO.md` §2.1 que el tutor va liso.

### D4. Ordenar por nombre, A-Z por defecto

Pedido por el usuario antes del commit. `sortByName(students, order)` en
`rosterFilters.ts`, pura y con pruebas, compara con
`localeCompare(…, 'es', { sensitivity: 'base' })`: ni las mayúsculas ni las
tildes cuentan, y «Ángela» va con las A. Por el **nombre entero**: el nombre es
un campo libre y separar el apellido no es fiable, así que se descartó.

El control es un selector «Ordenar» (A-Z / Z-A) junto al buscador, con el mismo
`FilterSelect` de los filtros de las tablas: va en la misma fila que el campo y
se lee como uno más de los ajustes de la lista. **A-Z por defecto** porque es lo
que el tutor espera de una lista de nombres —la de asistencia—. El orden sólo
afecta a los chips; el elegido sigue fijo encima.

## Risks / Trade-offs

- **Tres filas es una altura fija** y con nombres muy cortos caben más por fila.
  Es lo pedido: que no ocupe media pantalla. Se desplaza dentro.
- **Con «Todos» y muchos salones** el buscador es lo único práctico; la caja
  acotada lo hace soportable incluso sin buscar.
- **`isolate` en `<main>`** existía para que el fondo `-z-10` quedara detrás del
  contenido. Sin fondo deja de hacer falta, pero se conserva: quitarlo no aporta
  y podría cambiar el apilamiento de algún adorno.
