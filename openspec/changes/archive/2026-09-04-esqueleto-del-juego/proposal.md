## Why

El juego no existe. `docs/DISENO-DEL-JUEGO.md` describe qué es y cómo se puntúa,
`docs/CONTRATO-DE-INTEGRACION.md` fija qué manda y qué recibe, y
`docs/ROADMAP-JUEGO.md` ordena los doce pasos que lo construyen — pero en
`apps/web/src/` no hay ni una línea de él, ni una dependencia de 3D en
`apps/web/package.json`. Éste es el **J1**: el esqueleto, y lo único que tiene
que conseguir es que **aparezca algo en 3D dentro de la aplicación**.

Y arrastra una decisión que sólo se puede tomar aquí. `ROADMAP-JUEGO.md` §4 lo
dice sin rodeos: **el juego debe cargarse en diferido, y esa línea se pone en el
J1 o no se pone nunca.** El bundle ya sale del build en un solo trozo de
623,18 kB con el aviso de Vite de que pasa de 500 kB; el motor 3D y, más
adelante, Blockly suman bastante más. Si la carga diferida no entra con la
primera dependencia, entra cuando ya haya cinco pasos de juego escritos encima y
mover la frontera cueste tocarlos todos.

## What Changes

- **Tres dependencias en `apps/web`, y ninguna más:** `three`, `@types/three` y
  `@react-three/fiber` fijado a `^8.18`. **`drei`, Blockly y
  `@react-spring/three` NO entran**: `DISENO-DEL-JUEGO.md` §5 manda que cada una
  entre en el paso que primero la importe, y una dependencia que nadie importa
  es peso en el bundle sin evidencia de que haga falta.
- **Nace `apps/web/src/game/`**, la carpeta donde vive el juego. La decisión de
  que viva ahí y no en `packages/` la cerró el usuario el 4-sep-2026 y está
  escrita en `DISENO-DEL-JUEGO.md` §6: no se reabre.
- **Una escena 3D mínima**: un `<Canvas>`, una luz y un cubo. **Sin lógica de
  juego, sin rejilla y sin personaje** — eso es el J2.
- **Una pantalla nueva en el panel del niño que sólo existe en desarrollo**,
  gobernada por `import.meta.env.DEV` como ya lo está el botón «Sin login» de
  `components/home/Navbar.tsx`. **No es de usar y tirar:** es el banco de
  pruebas de toda la fase A, donde se verán funcionar el J2, el J4, el J5 y el
  J6, porque la pantalla de nivel real no llega hasta el J8.
- **La escena se carga en diferido**, con `React.lazy` y `Suspense`, de modo que
  el motor 3D viaje en su propio trozo del bundle y no en el principal.
- **NO se crea la ruta de nivel** `/dashboard/worlds/:worldId/:levelId`: es del
  paso 20 del roadmap principal, que es el J8 de éste.
- **NO se toca `apps/web/public/models/`.** Los 482 modelos de Kenney llegaron
  el 4-sep-2026 para no tener que buscarlos luego; la fase A se hace entera con
  cubos de colores y este paso no carga ninguno.

## Capabilities

### New Capabilities

- `juego-3d`: el juego dentro de la aplicación. En este paso la capacidad nace
  con lo mínimo que ya es comportamiento observable y permanente: que el juego
  se dibuje **dentro** de la aplicación sin build ni marco aparte, que su código
  **no viaje en la carga inicial**, y que el banco de pruebas desde el que se
  monta **sólo exista en desarrollo**. Las reglas de juego —rejilla, programa,
  pasos, puntuación— NO entran aquí: son del J2 en adelante.

### Modified Capabilities

Ninguna. `contenido-mundos` describe cómo se le presentan al niño los mundos y
los niveles, y este cambio no toca esa pantalla ni añade ninguna ruta de nivel.
`sistema-visual` tampoco: la pantalla nueva usa los tokens y las clases que ya
existen, no introduce ninguno.

## Impact

**Dependencias** — `apps/web/package.json`

| Paquete | Versión | Por qué esa |
| --- | --- | --- |
| `three` | ^0.170 | El motor 3D. **Se instaló ^0.185 y no dibujaba** con fiber 8: ver `design.md` decisión 1 |
| `@types/three` | ^0.170 | `three` **no trae tipos propios**. Sin este paquete el `tsc` de `npm run build` falla. Va a la par de `three` |
| `@react-three/fiber` | ^8.18 | Fiber 9 exige React ≥ 19 en sus `peerDependencies` y el repositorio va con React 18.3.1. Ver `DISENO-DEL-JUEGO.md` §5 |

**Código**

| Archivo | Cambio |
| --- | --- |
| `apps/web/src/game/GameScene.tsx` | **Nuevo.** La escena: `<Canvas>`, una luz y un cubo. Es el único módulo que importa `three` y `@react-three/fiber` |
| `apps/web/src/game/GameSceneLoader.tsx` | **Nuevo.** La frontera de carga diferida: `React.lazy` más `Suspense`, con su indicador de carga |
| `apps/web/src/components/dashboard/student/StudentGameLabModule.tsx` | **Nuevo.** La pantalla del banco de pruebas. Monta el cargador; **no** importa `three` |
| `apps/web/src/constants/routes.ts` | Añadir la ruta del banco de pruebas |
| `apps/web/src/router/AppRouter.tsx` | Registrar esa ruta **sólo** bajo `import.meta.env.DEV` |
| `apps/web/src/pages/Dashboard/Dashboard.tsx` | Un caso más en `renderStudentModule`, gobernado por `import.meta.env.DEV` |
| `apps/web/src/components/dashboard/Sidebar/Sidebar.tsx` | Una entrada de navegación más, visible **sólo** en desarrollo |

**Lo que NO se toca**

`apps/web/public/models/`, `ClassroomsProvider` y la frontera del store de
salones, `AuthProvider`, `PrivateRoute`, `PublicRoute`, los servicios y
`types/database.types.ts`. Ninguno tiene nada que ver con este paso.

**Bundle.** Es la mitad del criterio de aceptación, y las dos cifras se comparan
contra la línea de partida medida hoy: **un solo trozo de 623,18 kB (166,96 kB
gzip), 177 módulos**. Después del cambio tiene que haber **un trozo aparte** con
el motor 3D, y el principal **no debe crecer más que el coste de la propia
frontera de carga diferida** — medido con una sonda antes de proponer: ~1,15 kB
del ayudante de precarga que Vite añade al abrir el primer `import()` dinámico.
El detalle está en `design.md`.

**Tests.** Los 109 tests de 15 archivos deben seguir pasando **sin tocarlos**.
**No se escribe ningún test que monte `<Canvas>`**: jsdom no tiene WebGL, así que
un test así no probaría la escena, probaría el simulacro.

**Dependencia de Supabase: ninguna.** Este cambio **no necesita ningún
`db push`** y no hay migración. La fase A del juego no toca la base ni una vez,
y es deliberado: `ROADMAP-JUEGO.md` §1 explica que depurar la mecánica contra
una base de datos es depurar dos cosas a la vez.

**Documentación**

- `docs/ROADMAP-JUEGO.md` §3: el J1 pasa a ✅.
- `docs/CONTEXT.md`: el juego gana su primera entrada de capacidad aplicada.
- `openspec/config.yaml`: el bloque STACK no nombra todavía `three` ni
  `@react-three/fiber`. La ESTRUCTURA ya está al día.
