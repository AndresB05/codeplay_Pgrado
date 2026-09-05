## Context

El J1 dejó `apps/web/src/game/` con dos archivos: `GameScene.tsx`, que importa
`three` y `@react-three/fiber` y pinta un cubo, y `GameSceneLoader.tsx`, que es la
frontera de carga diferida y **no importa ninguno de los dos**. El motivo está en
proposal.md — Why.

Tres restricciones vienen de fuera y no se discuten aquí:

1. **El paso de la rejilla es la constante 1,0** y no se deduce de ningún modelo
   (`ROADMAP-JUEGO.md` §3). Los modelos de Kenney miden 1,082 de ancho por el
   labio de hierba, que se solapa a propósito; sacar el paso de ahí produce
   rendijas entre casillas.
2. **La rejilla admite huecos y muros** y para el J2 basta un concepto: cada
   casilla es transitable o no lo es. **Sin alturas.**
3. **El formato definitivo lo fija el J3.** Todo lo que este cambio escriba sobre
   la forma de `config` es provisional y se sabe.

Y una que viene de dentro y es la que ordena el diseño: **el J5 reutiliza las
reglas de movimiento** para el intérprete.

## Goals / Non-Goals

**Goals:**

- Que las reglas de movimiento se puedan ejecutar y probar **sin montar una
  escena**, para que el J5 las herede tal cual y para que el juego tenga por fin
  tests.
- Que el trozo principal del bundle **no crezca**.
- Que el tablero salga de la configuración y no del código que lo pinta, de modo
  que el J7 pueda cambiar de fuente sin tocar el dibujado.

**Non-Goals:**

- **No se diseña ningún puzle.** La rejilla de este cambio es de pega y sirve
  para ejercitar las reglas, nada más.
- **No se fija el formato de `config`** para el resto del proyecto: es el J3.
- **No se detecta la llegada a la meta, no se anima el movimiento y no se ejecuta
  ningún programa.** Es el J5.
- **No se viste nada.** Cubos de colores del tema; los modelos son el J7.4.

## Decisions

### 1. La configuración es una matriz de clases de casilla, no una de booleanos

```ts
type TileKind = 'floor' | 'wall' | 'gap';
type Direction = 'north' | 'east' | 'south' | 'west';

interface Cell { row: number; column: number }
interface Pose { cell: Cell; facing: Direction }

interface LevelConfig {
  tiles: TileKind[][];   // filas de norte a sur, columnas de oeste a este
  start: Pose;
  goal: Cell;
}
```

Transitable se **deriva**: `kind === 'floor'`. No hay un segundo campo
`walkable`, y es a propósito — dos campos que dicen lo mismo se contradicen en
cuanto alguien edite uno.

Esto es exactamente lo que `ROADMAP-JUEGO.md` §3 pide: un solo concepto
—transitable o no— con la diferencia entre hueco y muro reducida a **cómo se
pinta**. Las reglas de movimiento no distinguen los dos casos para decidir;
distinguirlos sólo sirve para poder decir por qué no se avanzó.

**Alternativa descartada:** `walkable: boolean[][]` más una lista aparte de muros.
Obliga a mantener dos estructuras alineadas y no gana nada.

**Alternativa descartada:** una lista de casillas (`{ row, column, kind }[]`) en
vez de una matriz. Es más flexible y se lee peor: la matriz **se dibuja en el
código fuente** —cinco filas de cinco entradas— y quien la mire ve el tablero.
Para un objeto escrito a mano eso vale más que la flexibilidad.

`row` y `column`, no `x` e `y`: `x` e `y` en una escena 3D son otra cosa, y
mezclarlos es el error clásico. La traducción a coordenadas del mundo vive en un
solo sitio (decisión 5).

### 2. Las reglas puras devuelven una pose nueva y el motivo del bloqueo

```ts
type Blocker = 'wall' | 'gap' | 'edge';

const turn = (facing: Direction, side: 'left' | 'right'): Direction
const advance = (config: LevelConfig, pose: Pose): { pose: Pose; blockedBy: Blocker | null }
```

Cuatro propiedades, y las cuatro son para el J5:

- **Puras.** Sin `three`, sin JSX, sin estado. La misma entrada da la misma
  salida.
- **Sin mutar.** `advance` devuelve una pose nueva. Es lo que permite al J5
  ejecutar un programa **plegando** la lista de órdenes sobre una pose inicial, y
  guardar las poses intermedias para animarlas.
- **Bloquear no es un error.** `advance` contra un muro devuelve la misma pose y
  `blockedBy: 'wall'`. No lanza —el repositorio no lanza en ninguna parte— y
  tampoco devuelve `{ data, error }`: esa convención es de los servicios, que
  hablan con el exterior y fallan por causas ajenas. Chocar con un muro no es un
  fallo, es una regla del juego.
- **El motivo entra ahora aunque hoy no lo lea nadie**, y es la única concesión
  al futuro que se hace aquí. Sale gratis —la función ya tiene que distinguir los
  tres casos para decidir— y el J5 lo necesita para decirle al niño por qué se
  paró. Un booleano habría obligado a repetir la comprobación fuera.

**Alternativa descartada:** meter también `hasReachedGoal(config, pose)`. Es del
J5, no hace falta para ver el tablero ni para mover al personaje, y añadirla
ahora es escribir para un consumidor que no existe.

### 3. El estado del personaje vive en `GameScene`, no en el módulo puro

Un `useState<Pose>` en el componente de la escena, inicializado con
`config.start`. Las órdenes llaman a `advance` o a `turn` y guardan la pose que
devuelven.

El módulo puro **no guarda estado**, y por eso se puede probar. Quién es el dueño
del estado es una decisión que el J5 puede revisar sin tocar las reglas — que es
justo lo que este reparto persigue.

**Alternativa descartada:** un contexto o un store para la pose. Nadie más la
necesita todavía, y el repositorio ya tiene una frontera de store que cuidar
—la de salones—; no conviene inventar una segunda sin consumidor.

### 4. Las órdenes se dan desde la consola, y sólo en desarrollo

`GameScene` registra en `window` un objeto con `forward`, `left`, `right` y
`reset`, dentro de un `useEffect` gobernado por `import.meta.env.DEV`, y lo
retira al desmontar. Tipado con un `declare global` en el mismo archivo; nada de
`any`.

Es literalmente el criterio de la fila J2 de `ROADMAP-JUEGO.md` §3 —«el personaje
se mueve llamando funciones desde la consola»— y es la superficie más pequeña que
lo cumple.

**Alternativa considerada y descartada: botones en la pantalla del laboratorio.**
Se ven mejor, pero el estado vive dentro del lado perezoso: los botones tendrían
que vivir ahí también, o el módulo de reglas subiría por encima de la frontera
diferida y acabaría en el trozo principal. Botones dentro del propio módulo
perezoso sí serían legítimos, pero son interfaz que el J4 va a sustituir por
bloques, y el roadmap no los pide.

El gateado por `import.meta.env.DEV` sigue el patrón que ya usan
`context/guest.helpers.ts` y el resto del banco de pruebas: **acceso de miembro,
nunca desestructurado**, para que Vite pueda eliminar la rama en producción.

### 5. Del tablero a la escena: una sola traducción de coordenadas

`row` y `column` se traducen a coordenadas del mundo **en un único sitio**, en
`GameScene`:

```
x =  (column - (columnas - 1) / 2) * TILE_SIZE
z =  (row    - (filas    - 1) / 2) * TILE_SIZE
```

El centrado deja el tablero alrededor del origen, así que la cámara no depende
del tamaño de la rejilla. Y **norte es −z**, que es lo que hace que avanzar
mirando al norte reste una fila.

Pintado, con `TILE_SIZE = 1` en todos los casos:

| Qué | Cómo |
| --- | --- |
| Casilla pisable | Losa de 1 × 0,2 × 1, con la cara de arriba en `y = 0` |
| Muro | Losa igual, más un bloque de 1 × 1 × 1 encima |
| Hueco | **No se dibuja nada.** Se ve el fondo de la pantalla, y eso es el vacío |
| Salida y meta | Losa del mismo tamaño, en otro color |
| Personaje | Bloque de 0,5 × 0,7 × 0,5 sobre la losa, **con un saliente pequeño en la cara que mira**, o el giro no se vería |

La cámara se queda fija, mirando el tablero entero desde una esquina alta. **No
entra `drei`**: `OrbitControls` sería cómodo para inspeccionar, pero un tablero de
5×5 cabe entero en una cámara fija, y la dependencia trae `three` en sus
`peerDependencies` con la trampa de la copia doble que `CONTEXT.md` §2.9
documenta. Si el J7.4 necesita orbitar para colocar modelos, entra ahí, con
motivo.

Los colores son nombres del tema duplicados a mano como hexadecimales, igual que
ya hace `CUBE_COLOR` hoy y por el mismo motivo: un material de `three` recibe un
color, no una clase de Tailwind.

### 6. Dónde se importa cada cosa, que es lo que sostiene el bundle

```
StudentGameLabModule.tsx  →  GameSceneLoader.tsx  ╎  GameScene.tsx  →  movement.ts
                                                  ╎                 →  debugLevel.ts → level.ts
                          sin `three`             ╎  frontera        con `three`     puros
```

La regla que hay que respetar al escribir los imports: **nada por encima de la
línea importa nada de la derecha**. Los módulos puros no arrastran `three`, pero
importarlos desde `StudentGameLabModule` o desde cualquier otro sitio de `src/`
los mete en el trozo principal, y con ellos la puerta abierta para que el J5
suba el intérprete detrás.

Es también lo que obliga a corregir dos frases de documentación: `GameScene.tsx`
deja de ser el único módulo de `src/game/`, así que «el único módulo que importa
`three`» ya no describe nada útil. La frase que se sostiene es la de la frontera.

### 7. Los tests

`movement.test.ts` al lado de `movement.ts`, que es el idiom del repositorio
—`invitationToken.helpers.test.ts`, `oauthRole.helpers.test.ts`—. Cubren lo que
la spec fija: avanzar a casilla pisable, contra muro, contra hueco y contra los
cuatro bordes; girar a los dos lados; cuatro giros seguidos volviendo al
principio; y que un avance bloqueado no cambia la orientación.

Se prueban contra **configuraciones escritas en el propio test**, no contra la de
`debugLevel.ts`: un test que dependa de la rejilla de pega se rompe el día que el
J7 la borre, y encima probaría dos cosas a la vez.

**Ningún test monta `<Canvas>`.** jsdom no implementa WebGL: probaría el
simulacro.

## Risks / Trade-offs

**[Los módulos puros acaban en el trozo principal sin que nadie lo note]** → Un
`import` desde `src/` fuera de `game/` basta, y no da error: el build sigue
pasando y el número sube. Mitigación: la tarea de verificación compara el tamaño
del trozo principal contra los 624,57 kB de partida, y una búsqueda comprueba que
nadie fuera de `apps/web/src/game/` importa `movement`, `level` ni `debugLevel`.

**[El formato de `config` de este paso se fosiliza]** → Es el riesgo de escribir
un formato provisional: el J3 puede encontrárselo ya usado en tres sitios y
acabar bendiciéndolo por inercia en vez de por diseño. Mitigación parcial: vive
en un solo archivo, lo consume un solo componente, y tanto proposal.md como el
comentario de cabecera de `level.ts` dicen que el J3 manda.

**[El hueco no se lee como hueco]** → Si el fondo de la escena y las losas se
parecen, una casilla que no se dibuja parece una casilla más. Mitigación: se
verifica mirando la escena en el navegador, que es el criterio del paso, y los
colores se eligen con contraste entre losa, muro y fondo.

**[Registrar funciones en `window` es una puerta trasera]** → Mitigación: sólo en
desarrollo, con el mismo gateado que el resto del banco de pruebas, y retirada al
desmontar el componente. En producción la rama entera desaparece del bundle, que
es lo que se verifica junto al resto.

**[Girar no se ve]** → Un cubo simétrico girado 90° es el mismo cubo. Es la razón
del saliente de la decisión 5, y por eso es requisito y no adorno.

## Migration Plan

No hay. No hay migración de base de datos, no hay `db push`, no hay datos
guardados que convertir y nada de lo que se toca existe en producción: el banco
de pruebas sólo se monta en desarrollo. Revertir es revertir el commit.
