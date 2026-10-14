## 1. Buscador de explorador

- [x] 1.1 `rosterFilters.ts`: exportar `matchesName(name, query)` y usarla en `filterRoster`; prueba en `rosterFilters.test.ts` (tildes, mayúsculas, vacío); `npm run test:run` pasa.
- [x] 1.2 `teacher/StudentPicker.tsx` según D1, montado en `TeacherPanelModule.tsx` con el alcance como `key` y navegando con `panelPath` como hoy. Pruebas en `TeacherPanelModule.test.tsx`: buscar filtra, el elegido se ve aunque la búsqueda lo excluya, sin coincidencias se dice.
- [x] 1.3 Verificar en navegador: la caja no pasa de unas tres filas con muchos exploradores, buscar sin tilde encuentra, elegir cambia la dirección y recargar conserva la ficha.
- [x] 1.4 `sortByName` en `rosterFilters.ts` con pruebas (A-Z con «Ángela» entre las A, Z-A, no muta) y selector «Ordenar» (A-Z por defecto) en `StudentPicker.tsx`, con prueba en `TeacherPanelModule.test.tsx`. Verificar en navegador que el elegido sigue fijo con los dos órdenes.

## 2. Fondo liso del tutor

- [x] 2.1 `TeacherDashboard.tsx`: `bg-lavender` en lugar de `jungle-surface` y sin `<PanelBackdrop />`. Verificar en navegador las pantallas del tutor —salones, detalle, panel, ajustes— y que el niño sigue con su fondo.
- [x] 2.2 `docs/ESTADO-DEL-PROYECTO.md` §2.1: el tutor va sobre lavanda liso.

## 3. Cierre

- [x] 3.1 `docs/CONTEXT.md`: buscador y fondo, con rutas reales.
- [x] 3.2 `npm run lint`, `npm run test:run` y `npm run build` pasan; `npx openspec validate panel-tutor-buscador-y-fondo-liso --strict` pasa.
