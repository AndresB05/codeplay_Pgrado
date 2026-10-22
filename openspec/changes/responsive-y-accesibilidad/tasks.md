## 1. Tanda 1 — Barra inferior en los dos roles

- [x] 1.1 `apps/web/index.html`: `viewport-fit=cover`; `main.css`: variable del alto de la barra y clase de posición fija con `env(safe-area-inset-bottom)`
- [x] 1.2 Niño: `Sidebar/StudentBottomNav.tsx` con los módulos de `Sidebar.tsx` (lista común), `aria-current` en las dos; `Dashboard.tsx` monta lateral o inferior con `useMinWidth(768)` y el relleno de `main`
- [x] 1.3 Tutor: `teacher/TeacherBottomNav.tsx` con rótulos cortos, nombre accesible largo y recuento de solicitudes; `TeacherSidebar.tsx` sólo en escritorio, sin la rama `roomy` ni su test de pantalla estrecha; `TeacherDashboard.tsx` monta una u otra y el relleno
- [x] 1.4 Tests de las dos barras inferiores; capturas a 375 y 1280

Hecho: iconos y lista del niño en `Sidebar/StudentNavIcons.tsx` y `Sidebar/studentNav.ts`, los del tutor en `teacher/teacherNav.ts`; tests en `StudentBottomNav.test.tsx` y `TeacherDashboard.test.tsx`.

## 2. Tanda 2 — Cada módulo a 375 px

- [x] 2.1 Barras superiores de los dos roles
- [x] 2.2 Niño: mundos, niveles de un mundo, nivel (sólo sin desborde), trofeos, salón y «Mi cuenta»
- [x] 2.3 Tutor: «Mis salones», detalle (solicitudes, tabla, podio), panel de información y ajustes
- [x] 2.4 A 375: desde «Mis salones» se llega al detalle de cualquier salón y se vuelve; «Mi cuenta» del niño se abre desde la barra superior
- [x] 2.5 Medir `scrollWidth` = `innerWidth` en cada pantalla; capturas

Hecho: XP en la barra superior del niño a 375 (`StudentTopBar.tsx`), cabecera de «Mi cuenta» (`StudentSettingsModule.tsx`), tabla del salón del niño con scroll propio y filtros del tutor en fila propia (`StudentRosterTable.tsx`), separador de acciones (`TeacherGroupDetailModule.tsx`) y fila de salones en ajustes (`TeacherSettingsModule.tsx`); el nivel queda con barra inferior porque no tapa Ejecutar ni Limpiar.

## 3. Tanda 3 — Accesibilidad y pantallas públicas

- [x] 3.1 `main.css`: `:focus-visible` global fuera de `.tutor-scope`
- [x] 3.2 Nombres accesibles en los botones de sólo icono que falten
- [x] 3.3 `/invite/:token`, login, signup y el aviso del `ErrorBoundary` a 375 px

Hecho: foco en `main.css` y en el buscador de salón del niño (`StudentClassroomSearch.tsx`), imagen del registro en `Signup.tsx`, columnas del seguimiento del tutor; ningún botón sin nombre accesible en las pantallas medidas. **Sin verificar** (las cuentas de prueba no tienen ese estado): el buscador del niño sin salón e «Ir a otro salón» del tutor.

## 4. Tanda 4 — Correcciones tras probar en el móvil

- [x] 4.1 Remaches de las bandas de cuero y del pasaporte de «Mi cuenta» a 375 (`main.css`, `StudentSettingsModule.tsx`)
- [x] 4.2 Nivel jugable por debajo de `lg`: pestañas Bloques/Tablero en la cabecera, caja en dos filas con `touch-none`, Ejecutar lleva al tablero, pantalla en columna flexible del alto de la ventana (`StudentLevelModule.tsx`, `game/BlockEditor.tsx`, `.level-compact-page`)
- [x] 4.3 Barra inferior también en el nivel, decidido por el usuario; el alto se gana en la cabecera, los marcos y la barra superior (lienzo de 234 px a 360×640 y 406 a 375×812)
- [x] 4.4 Tablones de la Sala de Trofeos: opción A elegida por el usuario, madera dibujada con CSS por debajo de `sm` (`main.css`) y hueco de la foto del gran trofeo con alto propio (`StudentTrophiesModule.tsx`)
- [x] 4.5 Más alto para el lienzo en el nivel estrecho: barra superior de 60 px (`StudentTopBar` con `slim`) y sin fila de mensaje en reposo (`quietWhenIdle` en `GameScene`)
- [x] 4.6 Al soltar un bloque la vista del lienzo no se mueve: el área desplazable incluye siempre la vista actual (`game/topAnchoredMetrics.ts`, con test); antes un bloque asomando por arriba arrastraba la vista. Ya pasaba antes del paso 25
- [x] 4.7 Los botones de `LevelCompleteDialog` y del `ConfirmDialog` del niño no parten el texto: `flex-auto` y `whitespace-nowrap`, y el que no cabe baja de fila (también en escritorio, donde el modal de 480 px los partía igual)
- [x] 4.8 Cruzar `lg` (girar una tableta) ya no vacía el lienzo: el hueco de la caja es un nodo fijo y el editor no se vuelve a montar

## 5. Cierre

- [x] 5.1 `npm run lint`, `npm run test:run` y `npm run build`
- [x] 5.2 `docs/CONTEXT.md` §4.4 cerrado (una línea) y la entrada en «aplicadas»
