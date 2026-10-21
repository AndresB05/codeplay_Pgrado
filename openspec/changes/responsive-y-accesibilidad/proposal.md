## Why

El panel no tiene repliegue para móvil (`CONTEXT.md` §4.4): a 375 px la barra
lateral del niño se come 262 px y la del tutor, aun plegada, 64; las secciones
se quedan estrechas y la navegación ocupa el sitio del contenido. Es el paso 25
del roadmap, y va ahora porque las ilustraciones (paso 26) ya están cerradas.

## What Changes

- **En móvil (por debajo de `md`, 768 px) la navegación entre módulos baja a una
  barra inferior fija**, en los dos roles. En móvil no hay barra lateral. Regla
  del usuario.
  - Niño: Mundos, Sala de Trofeos y Salón de clases (más el Laboratorio 3D sólo
    con las herramientas de desarrollo), en teclas de madera como las de la
    barra lateral.
  - Tutor: Salón de clases, Panel de información y Ajustes de cuenta, con las
    piezas `tutor-*`, rótulo corto visible («Salones», «Información»,
    «Ajustes») y el nombre completo como nombre accesible; el recuento de
    solicitudes en espera va en Salones.
  - La lista de salones de la barra lateral del tutor no baja: en móvil se llega
    a cada salón desde «Mis salones» y desde «Ir a otro salón».
- **El contenido no queda tapado por la barra**: relleno inferior del alto de la
  barra más `env(safe-area-inset-bottom)`, y `viewport-fit=cover` en
  `index.html` para que ese valor exista en los iPhone.
- **Todo el panel cabe a 375 px sin scroll horizontal de página**: barras
  superiores, tarjetas, bandeja de solicitudes, tabla de seguimiento (que sigue
  desplazándose dentro de su tarjeta), ajustes de los dos roles, mundos, niveles
  y trofeos, `/invite/:token`, login y signup.
- **Accesibilidad**: `aria-current="page"` en la navegación de los dos roles (al
  niño le falta), un foco visible para el niño, la portada y el acceso (el tutor
  ya tiene el suyo), y nombre accesible en todo botón que sólo lleva icono.
- **El escritorio no cambia**: a partir de `md` todo se ve como hoy, barra
  lateral plegable incluida.
- **`ErrorBoundary`**: ya existe desde el 21-sep-2026; sólo se comprueba que su
  aviso cabe a 375 px.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `sistema-visual`: se añaden tres requisitos —la navegación entre módulos va en
  barra inferior en móvil, las pantallas caben a 375 px sin scroll horizontal y
  la navegación y los botones de icono son accesibles—. Ninguno de los actuales
  cambia.

## Impact

- **Navegación:** `components/dashboard/Sidebar/Sidebar.tsx`,
  `components/dashboard/teacher/TeacherSidebar.tsx`,
  `pages/Dashboard/Dashboard.tsx` y `pages/TeacherDashboard/TeacherDashboard.tsx`
  (todas bajo `apps/web/src/`), con `hooks/useMinWidth.ts`, que ya existe. Una
  barra inferior nueva por rol, junto a su barra lateral.
- **Estilos:** `apps/web/src/main.css` (foco visible y, si hace falta, la clase
  de la barra inferior) sin colores nuevos; `apps/web/index.html` (`viewport-fit`).
- **Pantallas a 375 px:** lo que salga al medir, en `components/dashboard/student/`,
  `components/dashboard/teacher/`, `components/dashboard/shared/`,
  `pages/Invite/Invite.tsx`, `pages/Login/Login.tsx` y `pages/Signup/Signup.tsx`.
- **Tests:** `TeacherSidebar.test.tsx` y los de los módulos deben seguir en
  verde; se añade uno para la barra inferior de cada rol.
- **Supabase:** no interviene. No hay migración ni `db push`.
- **Fuera de alcance:** rehacer la pantalla del nivel para jugar en un teléfono
  (Blockly y la escena a 375 px): aquí sólo se garantiza que no desborda en
  horizontal. También el `SidebarNav.tsx` que no monta nadie.
