## Why

El área del tutor hereda entero el lenguaje del niño: Fredoka, contornos de 3 px
en tinta, sombras sólidas de pegatina, botones en píldora con relieve, chips
saturados y la insignia ilustrada de cada salón. Para un adulto que viene a leer
tablas y decidir —a quién aceptar, quién está atascado, qué misión asignar— eso
resta seriedad y, sobre todo, densidad: las cifras compiten con el adorno y las
tablas ocupan el doble de alto de lo que necesitan.

## What Changes

- **Un sistema visual propio del tutor que sigue siendo CodePlay**: una familia
  de tokens `tutor-*` en `main.css` y `tailwind.config.js` sobre la lavanda de
  la app y con el morado de la marca como acento; Fredoka se queda en los
  títulos y una tipografía de lectura nueva, **Atkinson Hyperlegible Next**,
  lleva el cuerpo, las tablas y las cifras, sólo en el tutor.
- **Piezas del tutor** en `@layer components`, con prefijo propio: tarjeta,
  botón (primario, secundario, peligro, fantasma; 36 px y 30 px), etiqueta de
  estado, campo, selector segmentado, tabla, cabecera de sección y franja de
  cifras. Radios de 12 px en superficies y 8 en controles, etiquetas en píldora
  fina, bordes de 1 px y sin sombras sólidas.
- **El color del salón pasa a ser una pestaña de carpeta**: una banda de color en
  el borde de la tarjeta y la cabecera del salón, con su insignia ilustrada a
  40–48 px, y sólo la pestaña junto a su nombre en la barra lateral. El
  degradado deja de usarse en el tutor; el niño lo conserva.
- **La barra superior lleva la marca y al tutor**: el logo del leopardo con
  «CodePlay» y el avatar real del tutor. La barra lateral pierde el avatar
  grande y la ficha del tutor.
- **Se aplica pantalla por pantalla**: barra superior, barra lateral (también
  plegada), «Mis salones» y el formulario de crear, el detalle del salón
  (solicitudes, sumar alumnos, exportar, podio, tabla de seguimiento y el diálogo
  de eliminar), el panel de información (alcance, cifras, buscador, ficha del
  explorador, misiones, cumplimiento y recursos) y los ajustes.
- **Mejora de lectura, no sólo de piel**: las cuatro tarjetas de cifras pasan a
  una sola franja; las tablas bajan a filas de 44–46 px con cabecera en
  minúscula, números alineados a la derecha y en cifras tabulares; las cabeceras
  de sección llevan su recuento y sus controles en la misma línea.
- **Los componentes compartidos ganan una variante `tutor`** (`StatCard`,
  `StudentRosterTable`, `ClassroomPodium`, `GroupBadge`, `ConfirmDialog`, `StoreErrorNotice`,
  `RosterFilterBar`, `ChangeNamePanel`, `ChangePasswordPanel`,
  `DeleteAccountPanel`, `SidebarToggle`). La variante por defecto no cambia, y
  el niño sigue montando la suya.
- **No cambia ningún comportamiento**: mismas rutas —incluida
  `/teacher/panel/:groupId/:studentId`—, mismos datos, misma ficha que recorre el
  catálogo, «Sin empezar» y «Sin superar» distinguidos con palabras y «?» donde el
  servidor no contó los pasos.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `sistema-visual`: se añade el requisito de que el área del tutor tenga su
  propio lenguaje visual, dentro de la marca y sin tocar el del niño, y se
  modifica el de la identidad por salón para que en el tutor no use degradado y
  la ilustración sólo salga donde hay sitio.

## Impact

- **Estilos:** `apps/web/src/main.css` (tokens `--tutor-*`, la fuente en el
  `@import` y las clases del tutor) y `apps/web/tailwind.config.js` (colores
  `tutor.*` y `fontFamily.tutor`). Tocar `tailwind.config.js` obliga a reiniciar
  el dev.
- **Tutor:** `pages/TeacherDashboard/TeacherDashboard.tsx` y, en
  `components/dashboard/teacher/`, `TeacherTopBar.tsx`, `TeacherSidebar.tsx`,
  `TeacherGroupsModule.tsx`, `CreateGroupForm.tsx`,
  `TeacherGroupDetailModule.tsx`, `PendingRequestsSection.tsx`,
  `AddStudentsPanel.tsx`, `ExportReportMenu.tsx`, `TeacherPanelModule.tsx`,
  `StudentPicker.tsx`, `MissionCompletionTable.tsx`, `TeacherResourceDialog.tsx`,
  `TeacherSettingsModule.tsx`, `TeacherIcons.tsx` y `chipClass.ts`.
- **Compartidos (sólo se añade la variante):** en `components/dashboard/shared/`,
  `StatCard.tsx`, `StudentRosterTable.tsx`, `ClassroomPodium.tsx`,
  `ConfirmDialog.tsx`, `StoreErrorNotice.tsx`, `RosterFilterBar.tsx`,
  `GroupBadge.tsx` (forma `'plain'`),
  `ChangeNamePanel.tsx`, `ChangePasswordPanel.tsx`, `DeleteAccountPanel.tsx`; y
  `components/dashboard/Sidebar/SidebarToggle.tsx`.
- **Niño:** ningún archivo suyo cambia. `AssignedMissionsPanel` no lo monta el
  tutor y queda fuera.
- **Tests:** `TeacherPanelModule.test.tsx` y `ExportReportMenu.test.tsx` deben
  seguir en verde sin aflojar sus comprobaciones.
- **Supabase:** no interviene. No hay migración ni `db push`.
- **Fuera de alcance:** el móvil (paso 25) y las ilustraciones.
