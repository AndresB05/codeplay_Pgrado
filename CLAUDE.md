# CodePlay

Plataforma web para enseñar pensamiento computacional a niños. Proyecto de grado.
Monorepo con npm workspaces: `apps/web` (React + TS + Vite + Tailwind) y
`supabase/` (esquema SQL). El juego vive dentro de la web, en
`apps/web/src/game/` (three.js y Blockly): Unity se descartó.

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

**La aplicación está entera sobre un backend real.** El esquema de Supabase
está aplicado en un proyecto real (las migraciones, en `supabase/migrations/`);
el acceso es de verdad —contraseña, Google y recuperación—; los salones viven en
la base y se sincronizan en vivo; y los nueve niveles se juegan leyendo su
definición de la base, con la puntuación, el XP, las rachas, los logros y las
misiones calculados en el servidor. La prueba preliminar se hizo el 25-sep-2026
sobre un despliegue provisional en Vercel. Lo que falta está en `docs/ROADMAP.md`.

El botón «Sin login» **autentica de verdad** con cuentas de prueba si hay
credenciales en `apps/web/.env`, y cae en la marca de invitado si no las hay. Él
y el Laboratorio 3D sólo existen en desarrollo y están apagados por defecto: se
encienden con `VITE_ENABLE_DEV_TOOLS=true` en `apps/web/.env`.

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
  el puntero, y sólo como iconos: no se reparten hojas ni flores por esquinas y
  cabeceras, que se retiraron porque no casaban con las ilustraciones.
- **Huecos de la mascota** (`.mascot-slot`, `ImagePlaceholder`): se dejan
  **vacíos** hasta que existan las ilustraciones definitivas. No los rellenes.
- **Store de salones:** ningún componente habla con Supabase ni con el
  almacenamiento del navegador para los salones: todo pasa por
  `useClassrooms()`, y `ClassroomsProvider` es la frontera. No la rompas.
- **`types/database.types.ts` se regenera con la CLI de Supabase, nunca se edita
  a mano.** Describe el esquema real. Lanzado desde PowerShell 5.1, el `>` lo
  deja en UTF-16: si `git diff --stat` lo marca como `Bin`, pásalo a UTF-8.

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
