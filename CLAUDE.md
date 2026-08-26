# CodePlay

Plataforma web para enseñar pensamiento computacional a niños. Proyecto de grado.
Monorepo con npm workspaces: `apps/web` (React + TS + Vite + Tailwind),
`supabase/` (esquema SQL) y `apps/game/` (Unity, todavía no existe).

## Antes de tocar nada

**Lee [`docs/CONTEXT.md`](docs/CONTEXT.md).** Es la fuente de verdad del estado
del proyecto: qué está implementado y dónde vive, qué falta, con qué prioridad y
qué deuda técnica condiciona cualquier diseño nuevo.

| Si vas a… | Lee además |
| --- | --- |
| Tocar interfaz | `docs/ESTADO-DEL-PROYECTO.md` §2 — guía de estilos completa |
| Tocar la base de datos | `supabase/README.md` — detalle migración por migración |
| Crear specs o cambios | `openspec/config.yaml` — contexto y reglas que consume OpenSpec |

## Estado actual

El esquema de Supabase **está aplicado** en un proyecto real —salones incluidos—
y la aplicación ya lee de él los mundos y los niveles. **El estado de salones
sigue en `localStorage`** con datos de ejemplo: conectarlo es el paso 10.

**Login real todavía no hay** —eso es el paso 12—, pero el botón «Sin login» ya
no simula nada: **autentica de verdad** con cuentas de prueba si hay credenciales
en `apps/web/.env`, y cae en la marca de invitado si no las hay. Sólo existe en
desarrollo.

`npm run build`, `npm run lint` y `npm run test:run` pasan. No los rompas.

## Reglas que no debes romper

- **Idioma:** código en inglés; comentarios, documentación e interfaz en español.
- **Comentarios:** explican *por qué*, nunca *qué*. El repo es parco en ellos a
  propósito. No añadas comentarios redundantes.
- **Componentes:** `export const Foo = () => {}`, nunca `export default`.
- **Servicios:** devuelven `{ data, error }` con `AppError`. Nunca lanzan.
- **Estilos:** usa los nombres de color del tema, nunca hex sueltos. Los tokens
  están duplicados a propósito en `src/main.css` y `tailwind.config.js`.
- **Adornos SVG:** van en `components/decor/`, con `aria-hidden` y sin capturar
  el puntero.
- **Huecos de la mascota** (`.mascot-slot`, `ImagePlaceholder`): se dejan
  **vacíos** hasta que existan las ilustraciones definitivas. No los rellenes.
- **Store de salones:** ningún componente lee `localStorage` directamente, todo
  pasa por `useClassrooms()`. `ClassroomsProvider` es el único archivo que cambia
  de raíz al conectar Supabase. No rompas esa frontera.
- **`types/database.types.ts` se regenera con la CLI de Supabase, nunca se edita
  a mano.** Hoy está desincronizado del esquema real: ver `docs/CONTEXT.md` §4.1
  antes de fiarte de él.

## Comandos

Todos desde la raíz. Para un workspace concreto: `npm run <script> -w @codeplay/web`.

```bash
npm run dev
```

`dev` (Vite, puerto 5173) · `build` (`tsc` + build) · `lint` (0 warnings) ·
`test` (Vitest en watch) · `test:run` (una pasada) · `preview` · `format`

## Flujo de trabajo

OpenSpec 1.10.0, esquema `spec-driven`. Criterio para decidir la vía:

- **Cambia lo que hace la aplicación** → propuesta de OpenSpec (`/opsx:propose`).
- **Herramienta, documentación o limpieza** → directo, sin ceremonia.

Al terminar cualquier cambio funcional:

1. Ejecuta `npm run lint`, `npm run test:run` y `npm run build`.
2. Actualiza `docs/CONTEXT.md` según el tipo de cambio:
   - **Afecta a una capacidad del producto** → mueve la entrada de «por
     aplicar» a «aplicadas», con la ruta real de los archivos.
   - **Herramienta, documentación o limpieza** → *no* va a esa lista: no sale
     de las prioridades P1-P6. Propaga lo que corresponda al stack o a las
     convenciones de §1.
3. Si cambiaste stack, estructura, convenciones o prioridades, **replica el
   cambio en `openspec/config.yaml`**. Es el único punto de duplicación
   deliberada del proyecto. Comprueba con `npx openspec doctor` que el YAML
   sigue parseando.
4. Al preparar el commit, **enumera las rutas** en `git add`, no uses
   `git add -A`. El commit `982a299` («Subir las actions de CI a @v5») se llevó
   por delante los cuatro artefactos de `backend-supabase-real`, que estaban sin
   commitear en el árbol: el mensaje no los mencionaba y ahí siguen. Con varios
   cambios de OpenSpec vivos a la vez, el árbol casi nunca contiene sólo lo que
   estás commiteando.
