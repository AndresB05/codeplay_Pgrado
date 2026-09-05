## Why

El J2 dejó un personaje que se mueve **llamando funciones desde la consola del
navegador**, y `StudentGameLabModule.tsx` lo dice en pantalla: «Todavía no hay
bloques —llegan más adelante—». Éste es el **J4** de `docs/ROADMAP-JUEGO.md` §3,
y su criterio es literal: **se arrastran bloques y se ve el JSON que producen**.

Y arrastra un encargo explícito del J3, escrito en `CONTRATO-DE-INTEGRACION.md`
§4.3: el interior del sobre `{ formatVersion, workspace }` **no se transcribió de
memoria a propósito**, porque el editor no estaba instalado y escribirlo de
memoria es escribirlo mal. Lo instala este paso, que es el primero que lo
importa, así que **el ejemplo real se pega aquí**, copiado de una salida de
verdad.

## What Changes

- **Entra Blockly**, la librería confirmada en `ROADMAP-JUEGO.md` §2, con **el
  juego mínimo de bloques**: `avanzar N`, `girar a la izquierda` y `girar a la
  derecha`. Nada más.
- **La versión es `^12.5.1`, no la 13, y no es preferencia.** Medido con
  `npm install --dry-run`: Blockly 13 declara `jsdom >=27.4.0 <30.0.0` como
  **peer dependency** y este repositorio va con `jsdom ^30.0.1` para Vitest, así
  que la instalación **falla con ERESOLVE**. Las salidas serían bajar jsdom
  —tocar el banco de pruebas entero por una librería de navegador— o instalar con
  `--legacy-peer-deps`, que deja el repositorio necesitando esa bandera para
  siempre y con un `npm ci` sin probar en el CI. La 12.5.1 **no declara ningún
  peer** y entra limpia. El detalle está en `design.md`.
- **El editor se carga en diferido, en su propio trozo.** La frontera que existe
  —`GameSceneLoader.tsx`— es la del motor 3D y **Blockly no cuelga de ahí**: no
  es 3D. Se le monta **su propia frontera, calcada de esa**, para que Blockly
  viaje aparte y **el trozo principal no suba de 624,57 kB**, que es la regla que
  el J1 puso y que el J2 y el J3 respetaron byte por byte.
- **La interfaz del editor va en español**, y no sólo el texto de los tres
  bloques: las categorías de la caja de herramientas, los menús contextuales
  —«Duplicate», «Delete Block»— y los avisos. Blockly publica sus mensajes
  traducidos y se cargan. Un editor a medio traducir parece terminado y no lo
  está.
- **El programa se lee del espacio de trabajo dentro del sobre del contrato**,
  `{ formatVersion: 'grid-blockly-1', workspace }`, y se ve en pantalla. Es el
  criterio de la fila del roadmap.
- **Se prueba el viaje de ida y vuelta**: guardar un espacio de trabajo, volver a
  cargarlo y comprobar que sale el mismo. Es lo único que valida la decisión del
  J3 —elegir el JSON nativo porque «Blockly serializa y deserializa solo»— y es
  barato aquí y caro en el J8, que es quien recibe el `starterProgram` y tiene
  que abrirlo con el mismo lector.
- **`CONTRATO-DE-INTEGRACION.md` §4.3 registra el interior del sobre**, copiado
  de una salida real, **y dice qué parte de la forma queda sin registrar**: el
  juego mínimo son dos formas de bloque, las dos **planas**, así que el ejemplo
  **no enseña anidamiento**, y §4.1 exige que el formato deje ver «qué bloques
  hay, en qué orden y anidados cómo». El `repetir N veces [cuerpo]` que §4.4 ya
  define y usa en su ejemplo resuelto **no existe todavía**, y el ejemplo tiene
  que decirlo en vez de parecer completo.
- **NO entra `repetir N veces`.** La fila del roadmap dice tres bloques y el
  alcance es el alcance. Lo que sí se hace es dejar escrito en el contrato en qué
  paso se registra la parte de la forma que falta.
- **NO se ejecuta el programa.** Animar al personaje y detectar la meta es el J5.
- **NO se cuentan pasos ni se pinta resultado.** Es el J6.
- **NO se toca Supabase**, ni se cablean `config` ni `starterProgram` desde la
  base: eso es el J8. Y **no se diseña ningún puzle**.

## Capabilities

### New Capabilities

Ninguna. `juego-3d` ya existe y es donde esto vive.

### Modified Capabilities

- `juego-3d`: gana **el editor de bloques**. Hasta hoy la capacidad garantizaba
  dónde y cómo se dibuja el juego, qué se dibuja y cómo se mueve el personaje,
  pero las órdenes se daban **sueltas y a mano**. Se le añaden: que exista un
  editor de bloques con el juego mínimo de órdenes, que su interfaz esté **entera
  en español**, que el programa construido se pueda **leer como JSON con la
  versión del formato pegada**, que ese JSON **se vuelva a cargar dando el mismo
  programa**, y que **el código del editor tampoco viaje en la carga inicial**.
  El requisito de las órdenes sueltas **no se retira**: el J5 es quien ejecuta el
  programa, y hasta entonces mover al personaje a mano sigue siendo el único modo
  de ver la escena responder.

## Impact

**Dependencias: una, y es de producción.** `blockly@^12.5.1` en
`apps/web/package.json`, instalada con
`npm install blockly@^12.5.1 -w @codeplay/web`.

- **Trae sus propios tipos** —`"types": "./index.d.ts"` en su `package.json`—,
  así que **no hace falta ningún `@types/blockly`**, que además no existe en el
  registro. Es la comprobación que el J1 aprendió a hacer con `three`, que sí los
  necesita.
- **Arrastra `jsdom@26.1.0` como dependencia normal** —lo hacen todas sus
  versiones, y la 13 es la primera que lo pasa a `peer`—, que son 77 paquetes más
  en `node_modules`. **No pesa en el navegador**: sólo lo usa su punto de entrada
  de Node, y la compilación para navegador no lo resuelve.
- **El lockfile se toca, y hay que revisarlo después.** `package-lock.json` lleva
  los **ocho** binarios de plataforma de `@supabase/cli` —los `darwin`, los
  `linux` y los `windows`— y el CI corre `npm ci` sobre `ubuntu-latest`. Se
  instala con `npm install`, nunca regenerando el lockfile, y **se cuentan los
  ocho después**. La rama `juego` no se ha empujado nunca: si se fueran, el fallo
  aparecería como el primer resultado de CI del juego y parecería otra cosa.

**Código** — todo bajo `apps/web/src/game/`

| Archivo | Cambio |
| --- | --- |
| `apps/web/src/game/program.ts` | **Nuevo. Puro.** El sobre del contrato §4.3: el tipo, la constante `grid-blockly-1` y las funciones que lo cierran y lo abren. Sin Blockly y sin JSX |
| `apps/web/src/game/program.test.ts` | **Nuevo.** El sobre: que se cierre con la versión correcta y que una desconocida se rechace entera |
| `apps/web/src/game/blocks.ts` | **Nuevo.** La definición de los tres bloques y la caja de herramientas. Importa Blockly, así que vive bajo la frontera |
| `apps/web/src/game/blocks.test.ts` | **Nuevo.** El viaje de ida y vuelta, contra un espacio de trabajo sin interfaz |
| `apps/web/src/game/BlockEditor.tsx` | **Nuevo.** El editor: inyecta Blockly en un `div`, carga el español y publica el programa. **El lado perezoso de la frontera nueva** |
| `apps/web/src/game/BlockEditorLoader.tsx` | **Nuevo.** La frontera, calcada de `GameSceneLoader.tsx`: `React.lazy` + `Suspense`, y **aquí no se importa Blockly** |
| `apps/web/src/components/dashboard/student/StudentGameLabModule.tsx` | Monta el editor y enseña el JSON que produce. El texto que hoy dice «Todavía no hay bloques» deja de ser cierto |

**La frontera del bundle son ahora dos, y la regla es la misma.** Nada por encima
de una frontera diferida importa lo que ésta aísla: `GameSceneLoader.tsx` no
importa `three`, `BlockEditorLoader.tsx` no importa `blockly`, y la pantalla del
laboratorio no importa ninguno de los dos. **Los módulos puros van con su
frontera**: `program.ts` no arrastra Blockly, pero importarlo desde encima de la
línea lo metería en el trozo principal.

**Bundle.** La línea de partida, medida hoy sobre `60972ad`: trozo principal
**624,57 kB** (167,68 gzip), trozo `GameScene` **825,21 kB** (222,25), **209
módulos**. Después del cambio el principal **no debe subir**, y se comprueba
además que una marca inequívoca de Blockly aparezca **cero veces** en él, como el
J1 hizo con `WebGLRenderer`.

**Tests.** Los 121 tests de 16 archivos siguen pasando **sin tocarlos**, y se
suma un archivo nuevo. Se lanzan con `npm run test:run`: `npx vitest run` desde
la raíz se salta la configuración del workspace.

**Dependencia de Supabase: ninguna, y no hay `db push`.** No hay migración y no
se toca el esquema. `ROADMAP-JUEGO.md` §1 lo dice de toda la fase A: no toca
Supabase ni una vez, y es deliberado.

**Documentación**

- `docs/CONTRATO-DE-INTEGRACION.md` §4.3: el interior del sobre, de una salida
  real, y qué parte de la forma queda sin registrar y en qué paso se registra.
  **§8 pierde su viñeta del sobre**, que hoy dice que ese interior está sin
  fijar.
- `docs/ROADMAP-JUEGO.md` §3: el J4 pasa a ✅, y la nota «el interior del sobre lo
  registra el J4» pasa a hecho.
- `docs/CONTEXT.md` §2.9: las rutas reales de los archivos nuevos y la frontera
  del bundle, que deja de ser una.
- `docs/CONTEXT.md` §4.8: las medidas nuevas.
- `docs/ESTADO-DEL-PROYECTO.md`, la fila «Librerías del juego»: dice que React
  Three Fiber y Blockly están «pendientes de confirmar», y quedaron **confirmadas
  el 4-sep-2026**. Se corrige **esa fila**; el resto del desfase de ese documento
  no es de este cambio.
- `openspec/config.yaml`, bloque STACK: gana Blockly, y la frontera diferida deja
  de ser una sola.
- `openspec/specs/juego-3d/spec.md`, el `## Purpose`: dice que «el programa de
  bloques todavía no existe». Deja de ser cierto, y **ningún delta transporta el
  Purpose**: se reescribe a mano **al archivar**.
