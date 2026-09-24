## Context

El dato del reporte ya existe y el tutor ya puede leerlo (ver proposal.md, Why).
Lo relevante para el diseño:

- `classroom_level_progress` y `classroom_level_attempts` (migración
  `202606030034`) llevan **`group_id`** y filtran por tutor dentro de la vista.
  Hoy sólo se consultan por `student_id`, un explorador cada vez, desde
  `studentProgressService.getDetail`.
- `buildWorldProgress(catalog, detail)` en `teacher/classroomsData.ts` ya cruza
  el catálogo con el progreso de un explorador: pone los niveles sin empezar, y
  los despublicados con progreso al final de su mundo. Es exactamente la forma
  que pide el detalle del reporte.
- `ClassroomStudent` (en `group.students`, vía `useClassrooms()`) ya trae XP,
  racha, niveles y mundos superados, intentos totales y marca media. **No** trae
  la fecha de la última actividad: sólo `hoursSinceLastActivity`, una distancia.
- La aplicación no tiene hoy ninguna descarga de archivos, ni ninguna librería de
  PDF.

## Goals / Non-Goals

**Goals:**

- Que el reporte y la ficha del panel no puedan discrepar: mismas vistas, mismo
  cruce con el catálogo.
- Que la librería de PDF no se descargue hasta que alguien pida un PDF.

**Non-Goals:**

- Exportar por explorador, o todos los salones a la vez.
- Programar exportaciones o enviarlas por correo (eso sería la mitad B del 19).
- Incluir la tira de pasos partida a partida: el detalle da el mejor resultado
  por nivel. La historia completa se sigue viendo en el panel.
- Gráficas en el PDF.

## Decisions

### 1. Una consulta por salón, no una por explorador

`studentProgressService` gana `getClassroomDetail(groupId)`, que pide las dos
vistas con `.eq('group_id', groupId)` y devuelve un `StudentProgressDetail` por
explorador. Son **dos consultas** para cualquier tamaño de salón; reutilizar
`getDetail` en un bucle serían 60 para un salón de 30.

Reutiliza `mapProgressRow`, `mapAttemptRow` y `progressError` del mismo archivo.
Va en este servicio y **no** en `ClassroomsProvider`: el reporte es una lectura
puntual al pulsar el botón, no estado compartido, así que no cruza la frontera
del store de salones. `useClassrooms()` sigue siendo la única fuente del roster,
y de él salen los miembros y sus cifras de resumen.

**Quién entra en el reporte lo decide el roster, no la vista.** El reporte
recorre `group.students` y busca en el detalle a cada uno; las filas de la vista
de alguien que ya no esté en el roster se ignoran. Así una expulsión que la vista
todavía no refleje no mete a nadie de más.

### 2. Las filas se construyen en una función pura; los formatos sólo las pintan

`teacher/classroomReport.ts` exporta `buildClassroomReport(group, catalog,
details, now)` → `{ summary: SummaryRow[], detail: DetailRow[] }`, con valores
ya decididos (`null` para lo que no existe, estados como texto). Encima, dos
escritores independientes:

- `classroomReportCsv.ts` → `toCsv(rows, columns)`, sin librerías.
- `classroomReportPdf.ts` → `downloadClassroomReportPdf(report, group)`, que
  hace el `import()` dinámico de la librería.

Así todo lo que decide qué dice el reporte se prueba con Vitest sin tocar ni el
DOM ni la librería, y los escritores sólo deciden cómo se ve.

El detalle sale de `buildWorldProgress` por explorador, sin reescribirlo. Los
«menos pasos» son el mínimo de `steps` entre las partidas con `isSuccess`,
ignorando los `null`; si no queda ninguno, `null`. La última actividad es el
`createdAtIso` más reciente de sus partidas, y por eso sale del detalle y no de
`hoursSinceLastActivity`.

`now` entra como parámetro para que el nombre del archivo y la fecha del
documento sean deterministas en los tests.

### 3. CSV: punto y coma, BOM y neutralización de fórmulas

- **Separador `;`**. Excel en español —Colombia usa la coma decimal— toma `;`
  como separador de lista, y con `,` abriría todo en una columna. Google Sheets
  lo detecta solo.
- **BOM UTF-8 al principio**. Sin él, Excel abre el archivo en la página de
  códigos local y rompe las tildes y las eñes.
- **Fin de línea `\r\n`**, el del RFC 4180.
- Todo campo con `;`, `"`, `\r` o `\n` va entre comillas, con las comillas
  duplicadas.
- **Fórmulas**: un campo de texto que empiece por `=`, `+`, `-`, `@`, `\t` o
  `\r` se prefija con `'`, la mitigación que recomienda OWASP para «CSV
  injection». Se aplica a los textos, no a los números: un número negativo no
  llega nunca, pero prefijarlo lo convertiría en texto.
- Los `null` salen como celda vacía.
- Números con `,` decimal no hace falta: la marca media y los pasos son enteros.

Dos archivos y no uno, porque un CSV no tiene hojas y mezclar filas de resumen y
de detalle en uno solo impide filtrarlo.

### 4. PDF con `jspdf` + `jspdf-autotable`, cargados bajo demanda

**Elegida sobre la alternativa de `window.print()`** con una hoja de estilos de
impresión, que no añade dependencia: esa vía abre el diálogo del navegador, deja
que el tutor elija «Guardar como PDF» o no, y el resultado depende del navegador
—márgenes, cabeceras con la URL—. Para un archivo que se entrega, el usuario
eligió PDF como formato propio, y eso pide generarlo.

`jspdf-autotable` resuelve lo único difícil de un PDF de tablas: partir una tabla
de decenas de filas en páginas repitiendo la cabecera. Escribirlo a mano sobre
`jspdf` sería el grueso del trabajo.

Las dos son MIT y se cargan con `import()` dentro del manejador del botón, así
que Vite las saca a un trozo aparte y **la carga inicial no crece**. Se comprueba
en la salida de `npm run build`.

El documento: página horizontal A4, título con el nombre y el ID público del
salón, fecha de generación, tabla del resumen, y la del detalle agrupada por
explorador. Las fuentes estándar de `jspdf` cubren Latin-1 —tildes, eñes, `«»`—,
que es todo lo que la interfaz escribe; no se incrusta ninguna fuente.

### 5. El botón: un menú con tres opciones en el detalle del salón

«Exportar reporte» junto a «Ver progreso» en `TeacherGroupDetailModule.tsx`, con
un menú de tres opciones: «Resumen (CSV)», «Detalle por nivel (CSV)» y «Reporte
completo (PDF)». Mientras se genera, el botón dice que está trabajando y no
admite otro clic. Con el salón vacío, deshabilitado con el motivo visible.

El catálogo se pide con `getCatalog()` al exportar, igual que el panel; no se
cachea entre exportaciones porque es una consulta pequeña y un catálogo viejo
daría un reporte que no cuadra con la ficha.

La descarga en sí —`Blob`, `URL.createObjectURL`, un `<a download>` efímero— va
en un ayudante `downloadBlob` dentro de `classroomReportCsv.ts`, que también usa
el PDF vía `doc.output('blob')`, para que haya una sola forma de descargar.

Nombres: `codeplay-<ID público>-resumen-AAAA-MM-DD.csv`,
`codeplay-<ID público>-detalle-AAAA-MM-DD.csv` y
`codeplay-<ID público>-reporte-AAAA-MM-DD.pdf`, con la fecha local.

## Risks / Trade-offs

- **[`jspdf` arrastra dependencias opcionales]** (`html2canvas`, `dompurify`,
  `canvg`) que sólo usa su método `.html()`. → No se usa ese método. Si el build
  se queja de resolverlas, se comprueba al instalar y se decide entonces; no
  cambia la especificación.
- **[Fechas en la zona del navegador]** → La última actividad se escribe en hora
  local del tutor, que es la que espera leer. Un tutor en otra zona vería otra
  hora; para un salón es aceptable.
- **[Datos de menores fuera de la plataforma]** → No cambia lo que el tutor ve,
  sólo dónde lo guarda. Queda anotado para la política de privacidad del paso 14
  (proposal.md, Impact).
- **[El reporte puede quedar desfasado del panel abierto]** → Se genera con una
  lectura fresca en el momento del clic, así que como mucho es **más** nuevo
  que la pantalla, nunca más viejo.

## Migration Plan

Sin migración ni `db push`: las vistas y sus permisos ya están aplicados. Revertir
es quitar el botón y los tres archivos nuevos, y desinstalar las dos
dependencias.
