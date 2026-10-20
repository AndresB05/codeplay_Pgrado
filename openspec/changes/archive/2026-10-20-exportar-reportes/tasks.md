## 1. Dependencias

- [x] 1.1 Instalar `jspdf` y `jspdf-autotable` en `@codeplay/web` (`npm i jspdf jspdf-autotable -w @codeplay/web`) y verificar que aparecen en `apps/web/package.json` y que `npm run build` sigue pasando

## 2. Servicio — `services/studentProgress.service.ts`

- [x] 2.1 Añadir `getClassroomDetail(groupId)` a `StudentProgressService`: dos consultas a `classroom_level_progress` y `classroom_level_attempts` con `.eq('group_id', groupId)`, agrupadas en un `Record<studentId, StudentProgressDetail>`, reutilizando `mapProgressRow`, `mapAttemptRow` y `progressError`. Verificar con tests en `studentProgress.service.test.ts`: agrupa por explorador, ordena las partidas de la más vieja a la más nueva y devuelve `{ data: null, error }` si falla cualquiera de las dos
- [x] 2.2 Añadir `getClassroomDetail` al doble de `TeacherPanelModule.test.tsx` y a cualquier otro mock de `studentProgressService`, y verificar que `npm run test:run` sigue en verde

## 3. Filas del reporte — `teacher/classroomReport.ts`

- [x] 3.1 Escribir `buildClassroomReport(group, catalog, details, now)` → `{ summary, detail }` según la decisión 2 del diseño, apoyándose en `buildWorldProgress` e `isWorldFinished`. Verificar con `classroomReport.test.ts` todos los escenarios de «El reporte recorre el catálogo y no inventa cifras»: explorador sin jugar, «Sin superar», pasos `null` que no salen como cero, 2 × 9 = 18 filas de detalle, un nivel despublicado con progreso que aparece
- [x] 3.2 Verificar en el mismo test que un explorador que la vista trae pero no está en `group.students` no entra, y que una JoinRequest pendiente tampoco
- [x] 3.3 Escribir `buildReportFileName(publicId, kind, now)` y verificar con un test el formato `codeplay-<ID>-<tipo>-AAAA-MM-DD.<ext>`

## 4. CSV — `teacher/classroomReportCsv.ts`

- [x] 4.1 Escribir `toCsv(rows, columns)` con `;`, BOM UTF-8, `\r\n`, comillado RFC 4180 y el prefijo `'` sobre textos que empiecen por `=`, `+`, `-`, `@`, `\t` o `\r`. Verificar con `classroomReportCsv.test.ts` los dos escenarios de «El CSV se abre bien y no ejecuta nada» y que `null` sale como celda vacía
- [x] 4.2 Escribir `downloadBlob(blob, fileName)` y las dos descargas CSV (resumen y detalle) con cabeceras en español. Verificar con un test que crea el enlace con el nombre correcto y revoca la URL

## 5. PDF — `teacher/classroomReportPdf.ts`

- [x] 5.1 Escribir `downloadClassroomReportPdf(report, group, now)` con `import()` dinámico de las dos librerías: A4 horizontal, título con nombre e ID público, fecha, tabla de resumen y tabla de detalle agrupada por explorador, entregado con `downloadBlob`. Verificar que `npm run build` saca `jspdf` a un trozo aparte y que el trozo de entrada no crece

## 6. Interfaz — `teacher/TeacherGroupDetailModule.tsx`

- [x] 6.1 Añadir el botón «Exportar reporte» junto a «Ver progreso», con menú de tres opciones, estado de carga que bloquea un segundo clic, aviso de error con palabras y deshabilitado con motivo en un salón sin miembros. Verificar con un test de componente: salón vacío deshabilitado, error del servicio muestra el aviso y no llama a `downloadBlob`
- [x] 6.2 Verificar en el navegador contra la base real, con la cuenta de tutor de `.env` y el salón `CP-PJE6`: descargar los tres archivos, abrir los CSV en una hoja de cálculo y comprobar tildes, columnas y que el detalle trae 2 × 9 filas; abrir el PDF y comprobar que la tabla parte bien entre páginas

## 7. Documentación y verificación final

- [x] 7.1 Mover «Exportar reportes» de P5 a las aplicadas en `docs/CONTEXT.md`, con las rutas reales, y anotar en §3.4 de `docs/ROADMAP.md` que la política de privacidad del paso 14 tiene que nombrar la exportación
- [x] 7.2 Ejecutar `npm run lint`, `npm run test:run` y `npm run build` desde la raíz y verificar que los tres pasan
