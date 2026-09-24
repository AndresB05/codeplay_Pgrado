## Why

Desde el paso 17 el tutor **ve** el progreso real de su salón, pero no puede
**sacarlo** de la plataforma: para anotarlo en su planilla de notas, compararlo
entre fechas o entregarlo a coordinación tiene que copiarlo a mano, explorador
por explorador. El dato ya existe y ya lo puede leer —las vistas de la
`202606030034` filtran por tutor—, así que lo que falta es sólo la salida. Es la
fila «Exportar reportes» de P5 en `docs/CONTEXT.md`, que no depende de nadie.

## What Changes

- **Botón «Exportar reporte» en el detalle del salón**
  (`TeacherGroupDetailModule.tsx`), junto a «Ver progreso». Exporta el salón
  entero; no hay exportación por explorador. Decisión del usuario del
  24-sep-2026.
- **Dos contenidos**, decididos por el usuario el mismo día:
  - **Resumen**: una fila por explorador —nombre, XP, racha, niveles superados
    sobre el catálogo, mundos terminados sobre el catálogo, marca media e
    intentos totales, fecha de la última actividad—.
  - **Detalle**: una fila por explorador y nivel, **recorriendo el catálogo** y
    no el progreso, igual que la ficha del paso 31: un nivel no empezado sale
    como «Sin empezar», distinto de «Sin superar».
- **Dos formatos**, decisión del usuario:
  - **CSV**, sin librerías: uno para el resumen y otro para el detalle, porque
    un CSV no tiene hojas.
  - **PDF** con las dos secciones en un solo documento, listo para imprimir o
    entregar. Trae la **primera dependencia nueva** desde `canvas-confetti`
    (`jspdf` + `jspdf-autotable`), cargada bajo demanda para que no pese en la
    carga de la aplicación.
- **Un nombre no puede convertirse en fórmula** al abrir el CSV en una hoja de
  cálculo. Los nombres los escribe el propio niño desde el paso 29, así que es
  una entrada ajena que llega al Excel del tutor.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `salones-tutor`: se añade el requisito de exportar el reporte del salón, con
  sus dos contenidos, sus dos formatos y la neutralización de fórmulas en el CSV.

## Impact

- **Código nuevo**: `apps/web/src/components/dashboard/teacher/classroomReport.ts`
  (construir las filas, puro y probado), `classroomReportCsv.ts` y
  `classroomReportPdf.ts` (los dos formatos), y el botón con su menú en
  `TeacherGroupDetailModule.tsx`.
- **Servicio**: `apps/web/src/services/studentProgress.service.ts` gana
  `getClassroomDetail(groupId)`, que lee `classroom_level_progress` y
  `classroom_level_attempts` por `group_id` —las dos vistas ya lo llevan— en dos
  consultas, en vez de dos por explorador.
- **Reutiliza sin tocar**: `buildWorldProgress` e `isWorldFinished` de
  `teacher/classroomsData.ts`, y `getCatalog()` del mismo servicio.
- **Dependencias**: `jspdf` y `jspdf-autotable` en `apps/web/package.json`.
- **Supabase: no necesita migración ni `db push`.** Las vistas y sus permisos
  son los de la `202606030034` y la `202606030035`, ya aplicadas.
- **Privacidad, para el paso 14**: el reporte saca de la plataforma datos de
  menores —nombre y progreso— hacia archivos que la plataforma ya no controla.
  No cambia qué ve el tutor, sólo dónde puede guardarlo, pero la política de
  privacidad tendrá que nombrarlo.
