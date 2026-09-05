## Context

El motivo está en `proposal.md` — Why. Lo que condiciona el **cómo** es todo lo
que ya está medido y no se puede romper:

- **La frontera del bundle que existe es la del motor 3D, y sólo esa.**
  `GameSceneLoader.tsx` esconde `GameScene.tsx` detrás de un `lazy()`, y por eso
  `three` viaja en su propio trozo. **Blockly no es 3D y no cuelga de ahí.** Un
  editor montado desde `StudentGameLabModule.tsx` con un `import` normal mete
  Blockly entero en el trozo principal, que lleva **624,57 kB clavados desde el
  J1** —el J2 y el J3 no lo movieron ni un byte—.
- **El J3 ya decidió el formato** (`CONTRATO-DE-INTEGRACION.md` §4.3): sobre
  `{ formatVersion, workspace }`, con el **JSON nativo del editor** dentro, sin
  traducir. La razón fue que «Blockly serializa y deserializa solo». Eso es una
  apuesta que **nadie ha comprobado todavía**, porque el editor no estaba
  instalado.
- **`three` dejó una lección de instalación**: no publica tipos, y sin
  `@types/three` el `tsc` que va delante del build falla. Antes de escribir nada
  hay que saber si Blockly los trae.
- **El lockfile lleva los ocho binarios de plataforma de `@supabase/cli`** y el
  CI corre `npm ci` sobre `ubuntu-latest`. Instalar toca el lockfile.
- **La rama `juego` no se ha empujado nunca**: el primer CI del juego será el de
  este paso, y cualquier rotura de instalación aparecería ahí disfrazada de otra
  cosa.

Este cambio **no toca la frontera del store de salones ni el esquema de la base
de datos**. No hay migración, no hay `db push` y `useClassrooms()` no aparece por
ninguna parte: la fase A del juego no habla con Supabase.

## Goals / Non-Goals

**Goals:**

- Que el trozo principal siga en **624,57 kB**, con Blockly viajando aparte.
- Que el interior del sobre quede registrado en el contrato **copiado de una
  salida real**, no transcrito de memoria.
- Que el viaje de ida y vuelta —guardar el espacio de trabajo y volver a
  cargarlo— quede **probado**, porque es lo único que valida la decisión del J3 y
  porque el J8 depende de ella para abrir el `starterProgram`.
- Que la pieza que el J5 y el J8 van a reutilizar —el sobre— nazca **pura**, sin
  Blockly y sin JSX, como nacieron las reglas de movimiento en el J2.

**Non-Goals:**

- **No se diseña el aspecto del editor.** Colores, tema y encaje con la selva son
  del apartado gráfico, que va por mundo y detrás de lo funcional (`ROADMAP-JUEGO.md`
  §3). Aquí el editor se ve con el aspecto que Blockly trae de fábrica, dentro de
  una tarjeta del sistema visual.
- **No se traduce el programa a una forma propia.** El J3 lo cerró: el nativo va
  dentro del sobre sin traducir, y un traductor antes de que exista el primer
  nivel es trabajo sin evidencia.
- **No se conecta el editor con la escena.** Los bloques producen JSON; el JSON
  no mueve a nadie hasta el J5.

## Decisions

### 1. Blockly `^12.5.1`, y la 13 no entra

**Medido, no razonado.** `npm install blockly --dry-run -w @codeplay/web`
termina en error:

```
npm error Found: jsdom@30.0.1
npm error peer jsdom@">=27.4.0 <30.0.0" from blockly@13.2.1
```

Blockly 13 es la primera versión que saca `jsdom` de sus dependencias normales y
lo declara **peer**, con un rango que este repositorio no cumple: Vitest va con
`jsdom ^30.0.1`. Y el peer **no es opcional** —Blockly no publica
`peerDependenciesMeta`—, así que npm no lo resuelve: falla.

Alternativas descartadas:

- **Bajar jsdom a `^29`.** Cambiar el entorno de los 121 tests del repositorio
  para acomodar a una librería que en el navegador no usa jsdom para nada. El
  precio no guarda ninguna relación con lo que se compra.
- **Instalar con `--legacy-peer-deps`.** Deja el repositorio necesitando esa
  bandera para siempre, y el CI corre `npm ci` sin ella. Sería aceptar una
  resolución que npm llama «potencialmente rota» en el primer CI que corre la
  rama del juego.

La 12.5.1 **no declara ningún peer** y el `--dry-run` sale limpio. Es además la
línea estable anterior, no una versión antigua.

**Trae sus propios tipos** (`"types": "./index.d.ts"`), así que no hay que buscar
un paquete de tipos: `@types/blockly` ni siquiera existe en el registro. Es la
comprobación que el J1 tuvo que aprender con `three`, hecha esta vez **antes** de
escribir código.

**Lo que sí cuesta:** todas las versiones de Blockly —incluida la 12— traen
`jsdom@26.1.0` como **dependencia normal**, y con ella 77 paquetes más en
`node_modules`. No pesa en el navegador: sólo lo usa `core-node.js`, el punto de
entrada de Node, y la compilación para navegador no resuelve esa condición.

### 2. Frontera propia para el editor, no colgarlo de la del motor 3D

**Un cargador nuevo, `BlockEditorLoader.tsx`, calcado de `GameSceneLoader.tsx`**:
`lazy()` + `Suspense`, y **sin importar Blockly**. El editor cae así en su propio
trozo, y el principal no se entera.

Alternativas descartadas:

- **Montar el editor dentro de `GameScene.tsx`**, aprovechando la frontera que ya
  existe. Funcionaría para el bundle, pero mete un componente de DOM dentro de un
  árbol de `@react-three/fiber`, donde los elementos no son etiquetas de HTML
  sino objetos de `three`. Es forzar una pieza a colgar de otra con la que no
  tiene nada que ver, y el J5 —que sí conecta las dos— tendría que
  desenredarlas.
- **Un `manualChunks` en `vite.config.ts`.** Resuelve el peso pero no la carga:
  el trozo seguiría pidiéndose al abrir cualquier pantalla, porque el `import`
  sería estático. La carga diferida es la garantía que la spec pide, no el
  troceado.

**Dos fronteras, una sola regla, y es la que `CONTEXT.md` §2.9 ya enuncia:**
nada por encima de una frontera diferida importa lo que ésta aísla. Los módulos
puros van con su frontera: `program.ts` no arrastra Blockly, pero importarlo
desde la pantalla del laboratorio lo metería en el principal.

### 3. Se importa `blockly/core`, no `blockly`

El punto de entrada principal del paquete arrastra dos cosas que aquí no se usan:
la **biblioteca de bloques estándar** —`controls_if`, `math_number`, `text`…, 89
kB sin comprimir— y el **generador de JavaScript**. Este juego define sus tres
bloques y no genera código: ejecuta el intérprete del J5 sobre el JSON.

`blockly/core` exporta todo lo que hace falta —`inject`, `setLocale`,
`svgResize`, `defineBlocksWithJsonArray`, `serialization`, `Workspace`—, así que
la única diferencia es lo que **no** entra.

### 4. El número va en un campo del bloque, no en un hueco para otro bloque

El bloque de avanzar lleva un **campo numérico dentro del propio bloque**
(`field_number`), no una entrada donde encaje un `math_number` u otra cosa.

No es comodidad: el contrato §4.4 exige que **las repeticiones sean números
presentes en el programa**, porque es lo que permite contar los pasos leyendo,
sin simular el juego. Un hueco para otro bloque abre la puerta a que ahí acabe
una expresión, y ese día el recuento deja de poder calcularse. Con un campo, la
garantía es **estructural**: no hay forma de escribir algo que no sea un número.

El campo se acota a **enteros de 1 a 10**, que es lo que un tablero de esta
escala admite; el valor sale del propio bloque y viaja en el JSON.

### 5. El español se carga con `setLocale`, y los tres bloques nacen en español

`Blockly.setLocale(Es)` con los mensajes de `blockly/msg/es`, que es el paquete
de traducciones que la propia librería publica. Eso cubre lo que no es nuestro:
las categorías de la caja de herramientas, los menús contextuales —«Duplicate»,
«Delete Block», «Help»—, los diálogos y los avisos. **El texto de nuestros tres
bloques se escribe en español directamente en su definición**, que es donde vive.

Alternativa descartada: **traducir a mano sólo lo que se ve**. Un editor a medio
traducir parece terminado y no lo está, y el menú contextual aparece en cuanto un
niño pulsa sobre un bloque.

### 6. El editor no lleva papelera, ni controles de zoom, ni sonidos

No es una decisión de aspecto: **es lo que evita tener que servir los ficheros de
`media/` de Blockly**. La papelera y los controles de zoom son imágenes que la
librería pide a una ruta configurable, y sin configurarla dan 404 en silencio.
Sin esas tres cosas, Blockly no pide ningún fichero suelto y el editor entra
entero en su trozo de JavaScript.

Borrar un bloque sigue siendo posible por las dos vías que Blockly da de fábrica:
arrastrarlo de vuelta a la caja de herramientas y el menú contextual —ahora en
español—.

### 7. Altura fija y aviso de cambio de tamaño

Blockly se inyecta en un `div` y **tiene la misma trampa que `<Canvas>`**: un
padre sin altura lo deja en cero. `StudentGameLabModule.tsx` ya lleva un
comentario avisándolo para la escena; el editor va en un contenedor con altura
fija por lo mismo.

Y trae una propia: al cambiar de tamaño el contenedor **hay que avisarle**, o el
lienzo se queda con las medidas viejas. Se resuelve con un `ResizeObserver` sobre
el contenedor que llama a `svgResize`, y no con el evento `resize` de la ventana:
la barra lateral del panel puede plegarse sin que la ventana cambie de tamaño.

### 8. El sobre vive en un módulo puro, y se prueba en dos niveles

`program.ts` no importa Blockly: sólo el tipo del sobre, la constante
`grid-blockly-1` y las dos funciones que lo cierran y lo abren. Es la pieza que
**el J8 reutiliza** para leer el `starterProgram` que llegue de la base, y el
J9 para mandar el intento — y ninguno de los dos tiene por qué depender del
editor para eso.

Se prueba en dos niveles, porque son dos cosas distintas:

- **El sobre**, en `program.test.ts`, sin Blockly: que se cierre con la versión
  correcta y que abrirlo con una versión desconocida se rechace entero, como
  manda §7 del contrato.
- **El viaje de ida y vuelta**, en `blocks.test.ts`, contra un **espacio de
  trabajo sin interfaz** —`new Blockly.Workspace()`, que no dibuja nada y por eso
  se puede probar aunque jsdom no tenga WebGL ni mida elementos—: se construye un
  programa, se guarda, se carga en otro espacio y se comprueba que al volver a
  guardarlo sale lo mismo.

### 9. Lo que se registra en el contrato, y lo que se dice que falta

El §4.3 recibe el JSON **copiado de una salida real** del editor, con los tres
bloques encadenados. Y recibe, al lado, la advertencia de que **ese ejemplo no
enseña anidamiento**: las tres formas de bloque de hoy son planas, y el
`repetir N veces [cuerpo]` que §4.4 ya define y usa en su ejemplo resuelto **no
existe todavía**. La parte más interesante de la forma —cómo se serializa un
cuerpo dentro de un bucle— se registra en el paso que construya ese bloque.

**No se adelanta `repetir` para poder registrarlo.** La fila del roadmap dice
tres bloques, y un bloque de más aquí es un bloque que el J5 tiene que ejecutar y
el J6 que contar sin que nadie lo haya pedido. Lo que no vale es pegar un ejemplo
plano y dejar que parezca completo.

## Risks / Trade-offs

- **El trozo de Blockly será grande** —el núcleo sin comprimir ronda el mega—.
  → Sale en su propio trozo y sólo se descarga al abrir una pantalla con editor.
  Es exactamente lo que la carga diferida compra, y el mismo trato que recibió el
  motor 3D. El aviso de Vite sobre los 500 kB seguirá saliendo: ya sale, y está
  anotado en `CONTEXT.md` §4.8.
- **`npm install` toca el lockfile y el CI corre `npm ci` en Linux.** → Se
  instala con `npm install`, **nunca regenerando** el lockfile, y después se
  cuentan los ocho binarios de `@supabase/cli`. Si faltara alguno, se restaura el
  lockfile y se repite.
- **El viaje de ida y vuelta podría no cumplirse.** → Entonces la decisión del J3
  está mal y hay que volver sobre ella, **no parchearla**: el aviso queda escrito
  aquí para que quien lo descubra no escriba una capa de compatibilidad por su
  cuenta. Es barato descubrirlo hoy y caro en el J8.
- **El test de ida y vuelta importa Blockly, y Vitest resuelve el punto de
  entrada de Node**, que es el que usa `jsdom`. → Es la copia de jsdom que
  Blockly instala como dependencia suya, así que existe. Si diera problemas, la
  salida es probar el sobre y comprobar el viaje en el navegador, dejándolo
  anotado — pero perdiendo la prueba automática, que es justo lo que el J8
  necesita heredar.
- **Blockly trae su propio aspecto y no es el de la plataforma.** → Aceptado a
  propósito: vestir es una pasada aparte y va por mundo, detrás de lo funcional.
  El editor va dentro de una tarjeta del sistema visual para que no desentone del
  todo.

## Migration Plan

No hay migración. No se toca la base de datos, no hay `db push` y nada de lo
guardado cambia de forma: el sobre que este paso empieza a producir es el que el
J3 ya había fijado por escrito.

Volver atrás es quitar los archivos nuevos, deshacer el `import` de la pantalla
del laboratorio y devolver `package.json` y `package-lock.json` a `60972ad`.
