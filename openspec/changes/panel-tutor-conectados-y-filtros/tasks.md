## 1. Conectados ahora (`classroomsData.ts`, `classroom.types.ts`)

- [x] 1.1 `getClassGroupStats(group, onlineIds)` con `connectedNow` en lugar de `activeToday`; reescribir sus pruebas en `classroomsData.test.ts` (cuenta sólo alumnos del salón, ignora ids de otros salones, cero sin conjunto); `npm run test:run` pasa.
- [x] 1.2 `TeacherGroupDetailModule.tsx` y `TeacherGroupsModule.tsx`: «Conectados ahora» en las tarjetas y «Conectados» en el chip de cada salón, con `onlineStudentIds` de `useClassrooms()`. Verificar en navegador con un niño conectado en otra pestaña que la cifra cambia sin recargar.

## 2. Filtros, puros (`shared/rosterFilters.ts`)

- [x] 2.1 `filterRoster` y `worldOptions` con pruebas: nombre sin tildes ni mayúsculas, mundo, «Sin empezar», conectado/inactivo, combinación y sin filtros.

## 3. Barra y tablas

- [x] 3.1 `shared/RosterFilterBar.tsx` según D3.
- [x] 3.2 `StudentRosterTable.tsx`: barra y filtrado sólo con `onRemoveStudent`, antes de ordenar, con mensaje y «Quitar filtros» si no queda nadie. Verificar en navegador en el detalle del salón y que «Mi salón» del niño no la lleva.
- [x] 3.3 `TeacherPanelModule.tsx`: barra con el selector de estado en «Quién ha cumplido», cumplida = todas, pendiente = alguna; vaciar al cambiar de salón. Verificar en navegador, o con pruebas en `TeacherPanelModule.test.tsx` si el salón de prueba no tiene misiones.

## 4. Cierre

- [x] 4.1 `docs/CONTEXT.md`: conectados y filtros, con rutas reales.
- [x] 4.2 `npm run lint`, `npm run test:run` y `npm run build` pasan; `npx openspec validate panel-tutor-conectados-y-filtros --strict` pasa.
