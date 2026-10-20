## 1. Sistema común del tutor (tanda 1)

- [x] 1.1 Añadir los tokens `--tutor-*` en `:root` de `apps/web/src/main.css` y los mismos bajo `tutor` en `apps/web/tailwind.config.js`, con los valores de design.md §2; verificar con un `grep` que cada token está en los dos archivos con el mismo hex, y reiniciar el dev
- [x] 1.2 Añadir Atkinson Hyperlegible Next (400, 500, 600, 700) al `@import` de `main.css` y `fontFamily.tutor` en Tailwind; verificar en la portada y en una pantalla del child que la pestaña de red no descarga sus archivos
- [x] 1.3 Crear `.tutor-scope` (familia del cuerpo, peso, tamaño base y `tabular-nums`; los `h1`–`h3` siguen en Fredoka por la regla global, sin regla nueva) y las piezas `tutor-card`, `tutor-btn*`, `tutor-badge*`, `tutor-field`, `tutor-seg`, `tutor-table`, `tutor-section-head` y `tutor-stats` en `@layer components`, con los radios de design.md §4 (12 / 8 / píldora), sin editar ninguna regla existente, con foco visible en `tutor-btn`, `tutor-field` y `tutor-seg`, sin texto `tutor-ink-faint` en ningún estado activo o seleccionado (4,36:1 sobre `tutor-accent-soft`) y con `tutor-field` siempre sobre superficie blanca (su borde da 2,93:1 sobre la lavanda); verificar con `git diff` de `main.css` que sólo hay líneas añadidas fuera de `@import`
- [x] 1.4 Adaptar `TeacherIcons.tsx` a trazo fino con `currentColor`, para que la barra lateral y las cabeceras usen esos iconos y no marcadores; verificar con captura que ninguno se lee como casilla

## 2. Armazón (tanda 1)

- [x] 2.1 `TeacherDashboard.tsx`: fondo `tutor-canvas` y altura de la barra superior a 56 px; `tutor-scope` va sólo en la raíz de `TeacherTopBar` y `TeacherSidebar` (design.md §3), no en el contenedor; verificar que la carga (`LoadingLeo`) no cambia
- [x] 2.2 `TeacherTopBar.tsx` según design.md §6, con el `BrandLogo` del leopardo y «CodePlay» en Fredoka, y `TUTOR_AVATAR` real junto al nombre, manteniendo los enlaces «Inicio» y «Recursos», el botón a Ajustes y su `aria-label`; verificar con captura a 1280 px
- [x] 2.3 `SidebarToggle.tsx`: añadir `variant?: 'default' | 'tutor'` sin tocar la rama por defecto; verificar que la barra del child se ve igual con captura
- [x] 2.4 `TeacherSidebar.tsx` desplegada (240 px) y plegada (64 px) con los iconos de 1.4, la pestaña de color del salón (`theme.color`) sin insignia, recuento de pendientes visible en los dos estados y `aria-label`/`title` en plegada, y sin el avatar grande ni la ficha del tutor (decidido por el usuario). «Cerrar sesión» queda abajo del todo (`mt-auto` con la barra a la altura completa de la ventana o `sticky`) y en `tutor-danger`. Verificar con capturas a 1280 px y a 1024 px plegada
- [x] 2.5 Pasada con teclado de la tanda: foco visible en la barra superior y en la lateral, desplegada y plegada, recorrible entera con Tab

## 3. Salones (tanda 2)

Cada pantalla que se migra lleva `tutor-scope` en su raíz.

- [x] 3.0 `GroupBadge.tsx`: forma `'plain'` (fondo `theme.colorSoft`, radio 10 px, sin contorno, sin sombra ni degradado, misma ilustración); verificar con captura que el buscador de salones y el salón del child, que usan `seal`, se ven igual
- [x] 3.1 `StatCard.tsx`: variante `'tutor'` como celda de `tutor-stats`; verificar con captura que `StudentClassroomModule` y `StudentWorldsModule` se ven igual que antes
- [x] 3.2 `TeacherGroupsModule.tsx` y `CreateGroupForm.tsx` con las piezas del tutor, la franja de cifras y cada salón como carpeta con pestaña y `GroupBadge` `plain` a 44 px, sin degradado en la cabecera; verificar con captura, incluido el formulario abierto con un error de validación
- [x] 3.3 `StoreErrorNotice.tsx`, `ConfirmDialog.tsx` y `RosterFilterBar.tsx` (`FilterSelect` incluido): variante `'tutor'`; verificar que el diálogo de borrar cuenta del child y el del juego se ven igual
- [x] 3.4 `StudentRosterTable.tsx` y `ClassroomPodium.tsx`: variante `'tutor'` (tabla densa con números a la derecha y los leopardos reales de `pickMascotAvatar`; podio como lista de tres); verificar con captura de `StudentClassroomModule` y `StudentWorldsModule` que el child no cambia
- [x] 3.5 `TeacherGroupDetailModule.tsx`, `PendingRequestsSection.tsx`, `AddStudentsPanel.tsx` y `ExportReportMenu.tsx` con las piezas del tutor y la cabecera de carpeta (pestaña de color y `GroupBadge` `plain` a 48 px, sin degradado), con «Eliminar salón» separado del resto de acciones como dice design.md §7; verificar que `ExportReportMenu.test.tsx` pasa sin cambiar sus aserciones, y captura del detalle con solicitudes, panel de sumar abierto y menú de exportar abierto
- [x] 3.6 Pasada con teclado de la tanda: foco visible en tarjetas de salón, formulario, acciones del detalle, menú de exportar, solicitudes, filtros, tabla y diálogo de eliminar

## 4. Panel de información (tanda 3)

- [x] 4.1 `chipClass.ts` y `StudentPicker.tsx`: alcance como `tutor-seg` con `aria-pressed`; orden como `<select>` (`FilterSelect` variante tutor), porque el test lo cambia con `fireEvent.change` sobre su etiqueta; explorador como botón seleccionable con `aria-pressed` y `title` «Pulsa otra vez para cerrar la ficha»; sin la «✕» del elegido (se confunde con el «×» de la tira de pasos), que pasa a un botón con palabras, «Dejar de ver a …»; verificar que el buscador sigue filtrando y vaciándose al cambiar de salón
- [x] 4.2 `TeacherPanelModule.tsx`: cifras en franja, ficha del explorador con sus datos de cabecera, filas de mundo y de nivel con `tutor-badge` («Sin empezar» mudo, «Sin superar» en espera, marca en ok) y la tira de pasos con «×» y «?», cada partida con `title` y `aria-label` («No superada · 4 pasos») y la leyenda en la cabecera de la columna (design.md §7), con «N con programa guardado» dentro de la columna Intentos, alineado a la derecha bajo la cifra; verificar que `TeacherPanelModule.test.tsx` pasa sin aflojar ninguna aserción
- [x] 4.3 `MissionCard`, `MissionCompletionTable.tsx`, recursos y `TeacherResourceDialog.tsx` con las piezas del tutor; verificar con captura con una misión eligiendo fecha y la tabla de cumplimiento visible
- [x] 4.4 Abrir `/teacher/panel/<salón>/<explorador>` con un enlace directo y comprobar que abre la misma ficha que antes
- [x] 4.5 Pasada con teclado de la tanda: foco visible en alcance, buscador, orden, exploradores, misiones (también eligiendo fecha), recursos y su diálogo

## 5. Ajustes (tanda 4)

- [ ] 5.1 `ChangeNamePanel.tsx`, `ChangePasswordPanel.tsx` y `DeleteAccountPanel.tsx`: variante `'tutor'`; verificar que los tests de los tres pasan y captura de «Mi cuenta» del child igual que antes
- [ ] 5.2 `TeacherSettingsModule.tsx` con las piezas del tutor, `TUTOR_AVATAR` real y la lista de salones con su pestaña; verificar con captura
- [ ] 5.3 Pasada con teclado de la tanda: foco visible en cerrar sesión, los tres paneles abiertos y la lista de salones

## 6. Cierre

- [ ] 6.0 Subir `tutor-scope` al contenedor de `TeacherDashboard.tsx` y quitarlo de las raíces sueltas (barras y pantallas); verificar con `grep` que sólo queda en el contenedor y con capturas que nada cambia

- [ ] 6.1 Buscar en `components/dashboard/teacher/` y `TeacherDashboard.tsx` las clases del child como palabra completa (`\bcard\b`, `\bbtn\b`, `\bchip\b`, `\bfield\b`, `\bfont-display\b`, `\bborder-ink\b`) y `shadow-\[`, para que `tutor-card` o `tutor-btn` no den falsos positivos, y retirarlas; verificar con `grep -E` que no queda ninguna
- [ ] 6.2 Capturas del child (`StudentClassroomModule`, `StudentWorldsModule` y «Mi cuenta») comparadas con las de antes del cambio, sin diferencias
- [ ] 6.3 Actualizar `docs/CONTEXT.md` §2.1 y `docs/ESTADO-DEL-PROYECTO.md` §2 con el sistema del tutor; apuntar en `docs/CONTEXT.md` §4 la deuda del niño encontrada en la tanda 2 (con «Eliminar mi cuenta» abierto, su barra superior queda sin velo porque el `<main>` del panel es `relative isolate` y el `z-50` del diálogo no sale de ese contexto; el del tutor ya va por portal; captura de referencia `t2c/nino-borrar.png` de la tanda 2); replicar en `openspec/config.yaml` y verificar con `npx openspec doctor`
- [ ] 6.4 Ejecutar `npm run lint`, `npm run test:run` y `npm run build` desde la raíz y verificar que los tres pasan
