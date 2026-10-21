## Context

Los dos paneles son `barra superior + flex(barra lateral, main)`. La lateral del
niño es un tronco de 262/92 px; la del tutor, 240/64 px, y por debajo de `md` ya
se fuerza a iconos con `useMinWidth(768)`. No hay barra inferior en ninguna
parte. El foco visible sólo existe en el tutor (`.tutor-focus`, `.tutor-btn`,
`.tutor-field`); el resto depende del contorno por defecto del navegador, que
`.field` y algunos componentes quitan con `outline-none`.

## Goals / Non-Goals

**Goals:** barra inferior en los dos roles por debajo de `md`; cada pantalla de
la lista del spec sin scroll horizontal a 375 px; `aria-current`, foco visible y
nombres accesibles; escritorio idéntico.

**Non-Goals:** rehacer la pantalla del nivel para jugar en un teléfono; colores,
tokens o ilustraciones nuevos; tocar el store de salones o el esquema.

## Decisions

- **Lateral o inferior se decide en JS con `useMinWidth(768)`, no con
  `hidden md:flex`.** Con CSS las dos navegaciones estarían en el DOM a la vez:
  los lectores de pantalla oirían dos menús y los tests (jsdom no evalúa media
  queries) encontrarían cada botón dos veces. `useMinWidth` ya existe, se lee al
  montar sin parpadeo y en los tests cae en escritorio, así que los actuales no
  cambian.
- **Una barra inferior por rol, junto a su lateral** (`Sidebar/StudentBottomNav.tsx`
  y `teacher/TeacherBottomNav.tsx`), no un componente común con variantes: las
  dos no comparten piel (madera frente a `tutor-*`) y lo único común, la
  posición fija y el área segura, es una clase. La lista de módulos sale de un
  sitio por rol para que lateral e inferior no diverjan.
- **La barra la monta la página** (`Dashboard`, `TeacherDashboard`), que ya
  decide si hay lateral (`showSidebar`) y reserva el relleno de `main`:
  alto de la barra + `env(safe-area-inset-bottom)`, sólo en móvil.
- **Rótulos cortos en el tutor** («Salones», «Información», «Ajustes») con el
  nombre largo como `aria-label`: los largos no caben en un tercio de 375 px.
  El niño conserva los suyos, que a 12–13 px sí caben.
- **Foco visible global para lo que no es del tutor**: una regla
  `:focus-visible` en `@layer base` con `grape-dark`, que `.tutor-scope` deja
  como está. Es un color de la paleta, no uno nuevo.
- **Store de salones:** la barra del tutor lee el recuento de solicitudes de los
  `groups` que ya le pasa `TeacherDashboard` desde `useClassrooms()`; no habla
  con Supabase ni con el navegador. La frontera no se toca.

## Risks / Trade-offs

- **El alto de la barra está en dos sitios** (la barra y el relleno de `main`) →
  una sola variable CSS para los dos.
- **Pantallas que sólo se ven con sesión no se pueden capturar con Edge
  headless** → se miden en el dev con las herramientas de desarrollo y el panel
  del navegador a 375 px (`scrollWidth` frente a `innerWidth`), y Edge headless
  se usa para las públicas y para las capturas que se pueda.
- **La pantalla del nivel a 375 px** queda jugable sólo a medias: se acepta y se
  anota en `CONTEXT.md` como deuda.
