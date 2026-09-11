## Context

Ver `proposal.md` — Why. Lo que condiciona el diseño, medido en el repositorio a
11-sep-2026:

- **La costura del tablero es una línea**: `GameScene.tsx:776`, `const config = debugLevel;`.
  `GameSceneLoader` no recibe hoy ningún nivel, y el tablero se centra solo en el
  origen (`GameScene.tsx:269-278`), así que la forma de la rejilla no es el
  problema. Lo que sí está cuadrado contra un 5 × 5 es el **encuadre**:
  `CAMERA_START = [6.7, 9.5, 9.5]` y `BOARD_LIFT = 1.8`. *(Y las posiciones de
  `SCENERY`, que dejaron de importar a mitad del cambio: el usuario retiró los
  assets enteros.)*
- **`Dashboard.tsx:19-21` colapsa cualquier ruta bajo `${ROUTES.WORLDS}/` en
  `WORLDS`** antes del `switch`, y dentro lo único que decide es
  `worldId ? niveles : mundos`. Una pantalla colgada ahí debajo sin tocar eso
  devuelve la lista de niveles **sin error que lo delate**, que es justo lo que
  avisa el comentario de `constants/routes.ts`.
- **`mapLevelRow` tira `narrative`, `starter_code` y `validation_rules`** aunque
  el `select('*')` los traiga, y el tipo `Level` tampoco los tiene.
- **Las tres columnas ya están reinterpretadas** (paso 23.1, `CONTEXT.md` §2.7):
  `validation_rules` es el `config`, `starter_code` el sobre del §4.3 y
  `programming_language` la versión del formato.
- **Ocho de los nueve niveles seguirán sembrados en el formato del juego
  anterior** cuando esto termine, así que el camino de rechazo del §7 no es
  teórico: se recorre abriendo cualquier otro nivel.
- **Las fronteras diferidas son dos** (`GameSceneLoader`, `BlockEditorLoader`) y
  la regla es que nada por encima de una frontera importe lo que ésa aísla.

## Goals / Non-Goals

**Goals:**

- Que el nivel 1 se juegue **desde su fila**, en la pantalla del producto.
- Que la frontera **compruebe** lo que llega, y que un nivel ilegible se rechace
  entero sin descargar el motor 3D.
- Que el encuadre deje de estar atado a un tamaño de tablero concreto.

**Non-Goals:**

- **No se toca el esquema.** La migración es de datos: ninguna columna se añade,
  se renombra ni cambia de tipo, así que `database.types.ts` no se regenera.
- **No se escribe nada en el servidor al terminar** (J9) ni se concede XP (J10).
- **No se viste nada.** El personaje sigue siendo el cubo morado, y a mitad del
  cambio el tablero **se desvistió** por decisión del usuario: fuera los assets
  del J6.4, vuelta a la geometría. El aspecto entero es el J13, que ahora hereda
  cubos y no un tablero con modelos.
- **No se tocan los niveles 2 y 3**, que son el J7.2 y el J7.3.

## Decisions

### La ruta es `/dashboard/worlds/:worldId/:levelId`, y el colapso se arregla donde está

Es la dirección que ya fijaron `CONTEXT.md` §3 P4 tarea 1 y `ROADMAP.md` paso 20,
y es la que se lee: un nivel pertenece a un mundo y la dirección lo dice.

El aviso de `routes.ts` **no prohíbe el prefijo**: dice que `Dashboard.tsx` se
traga lo que cuelgue de él. Así que el arreglo va ahí: el `switch` sigue cayendo
en `ROUTES.WORLDS` y lo que decide dentro pasa a ser
`levelId ? nivel : worldId ? niveles : mundos`, leyendo `levelId` del mismo
`useParams` que ya lee `worldId`.

**Alternativa descartada: una ruta hermana fuera de `worlds/`**, como la del banco
de pruebas. Evita tocar el colapso, pero pierde el mundo en la dirección —la
pantalla tendría que ir a buscarlo para saber adónde volver— y deja el aviso de
`routes.ts` en pie para el siguiente que lo intente. El colapso es un defecto, no
un contrato.

### La comprobación del `config` vive en `game/`, pura, y corre POR ENCIMA de la frontera diferida

Nace `game/levelConfig.ts`, calcado en forma y en motivos de `openProgram`
(`game/program.ts`): rechaza **entero**, y no devuelve el motivo porque todos los
motivos acaban igual.

Comprueba lo que el contrato §4.2 fija: que `tiles` sea una matriz no vacía, que
**todas las filas midan lo mismo**, que cada casilla sea una de las tres clases
—un valor desconocido **no** es suelo—, que `start` y `goal` caigan dentro del
tablero, que `facing` sea una de las cuatro direcciones y que `optimalSteps` sea
un entero mayor que cero.

**Y una comprobación que el contrato NO escribe: que la salida y la meta se
puedan pisar.** Una salida sobre un muro nace con el personaje dentro de él y una
meta sobre un hueco no se alcanza nunca: es un nivel imposible, o sea un `config`
que no describe un tablero jugable. Se añade a sabiendas de que va más allá de la
letra del §4.2, y el criterio es que **este error de siembra sí se puede cazar
leyendo** —a diferencia del `optimalSteps` mal escrito, que no— y cuesta dos
líneas en un módulo que ya existe. Con el J7.2 y el J7.3 sembrando dos tableros
más, es barato tenerlo antes que después.

**Y la puerta es una sola para los tres campos de la fila**, no una por campo:
`openLevel` recibe la versión, el `config` y el sobre tal y como vienen de la
base y devuelve el nivel listo para jugar o `null`. Es lo que el §7 describe —un
nivel se carga o no se carga— y evita que la pantalla tenga que acordarse de
llamar a tres comprobaciones y de combinar bien sus tres resultados.

**Quién la llama es la pantalla de nivel, no la escena**, y es la decisión que
importa: el §7 manda avisar **al anfitrión**, y el anfitrión es la pantalla. Con
la comprobación arriba, `GameScene` recibe un `LevelConfig` ya válido —su
propiedad no es opcional y no hereda ninguna rama de error— y, sobre todo, **un
nivel ilegible no descarga los 905 kB del motor**: la frontera diferida no se
cruza. Al revés —comprobar dentro de la escena— el error viviría al otro lado de
un `import()` que sólo existe para dibujar.

No rompe la frontera: `levelConfig.ts` es puro, no importa `three` ni Blockly, y
es del mismo tipo de módulo que `program.ts`, que el build ya saca en un trozo
propio de 0,35 kB compartido por los dos lados.

### La versión del nivel manda, la del sobre gobierna el sobre, y si no coinciden no se juega

La fila escribe la versión del formato **dos veces**: en su columna —que es el
`formatVersion` del nivel, §2— y dentro del sobre del `starterProgram`, §4.3. Las
dos las manda el contrato, así que la duplicación no es una invención de este
cambio; lo que faltaba por escribir es **cuál manda y qué pasa cuando no
coinciden**.

- **La del nivel manda.** Es la que dice si el juego desplegado puede con este
  nivel, y es la que el §7 nombra al hablar de una versión desconocida. Si no es
  la que el juego conoce, el nivel se rechaza entero sin mirar nada más.
- **La del sobre gobierna el sobre**, que es para lo que existe: viaja pegada a
  los bytes que describe y es la que acompañará al intento cuando el J9 lo mande.
  Quien la comprueba es `openProgram`, que ya está escrito y ya rechaza el sobre
  entero cuando no la reconoce.
- **Y un desacuerdo entre las dos rechaza el nivel**, aunque las dos sean
  conocidas por separado. No es celo: es que una fila que dice dos cosas
  distintas sobre sí misma **no tiene una lectura correcta**, y elegir una de las
  dos en silencio es justo lo que hace que sembrar mal la otra no lo cace nadie
  nunca. Es la razón por la que `level.ts` no tiene un campo `walkable` al lado de
  la clase de casilla, aplicada a la versión.

**Alternativa descartada: ignorar la columna y creerse sólo el sobre.** Ahorra
una comprobación y deja la columna como adorno —y un adorno que nadie lee se
siembra mal sin consecuencia visible hasta el día que alguien decida leerlo—.
**La simétrica, ignorar el sobre, es peor**: esa versión es la que viaja con el
intento guardado, y el servidor la va a leer sin tener la fila delante.

El desacuerdo lleva su propio test, porque es el único de los casos del §7 que
**no** se cae solo de una comprobación por campo: los dos campos son válidos y lo
que está mal es el par.

### El nivel se lee por su identificador, con una consulta propia

`worlds.service.ts` gana la lectura de **un** nivel por su id, y `mapLevelRow`
deja de tirar `narrative`, `starter_code` y `validation_rules`; el tipo `Level`
gana esos tres campos.

La pantalla tiene la dirección del nivel, así que pedir su fila es una consulta
con su clave. **Alternativa descartada:** traerse la lista del mundo y filtrarla
—que es lo que ya hace la pantalla anterior—: obliga a cargar el mundo entero
para jugar uno, y ata la pantalla de nivel a que se haya pasado por la lista.

Los tres campos se mapean **tal cual**, sin interpretar: `validation_rules` llega
como JSON sin tipo y quien lo comprueba es `levelConfig.ts`, no el servicio. Es
la misma línea que el contrato §4.2 pone entre comprobar y traducir.

### El encuadre se deriva del tablero, y el decorado se fue entero

`CAMERA_START` deja de ser una posición fija y pasa a ser esa misma dirección
**escalada por el lado mayor del tablero** contra los cinco de la rejilla de pega,
con el suelo de `MIN_DISTANCE`. **Y con ella se escalan `BOARD_LIFT` y
`MAX_DISTANCE`**: la subida coloca el tablero en la franja que la bandeja deja
libre y cuánto hay que subir depende de lo lejos que esté la cámara; el tope
recortaría un tablero de seis, porque la partida sale a 3,0026 por casilla. El
**suelo** no se escala, y no es incoherencia: no meterse dentro del tablero es
una distancia absoluta y no perderlo de vista es relativa a su tamaño. Con la
referencia de cinco, las tres escalas valen uno y la vista es exactamente la que
el J6.3 dejó encuadrada.

**El decorado ya no existe.** Este cambio llegó a tener una regla para moverlo con
el borde del tablero, y **está borrada porque el usuario retiró los assets
enteros**. Lo que la regla enseñó sí se conserva, en `CONTEXT.md` §4.10: conservar
la distancia del centro **no** es conservar el hueco —acercar piezas de 2,08 al
borde de un tablero de una fila las sube encima de él y deja la escena en blanco
sin un solo error en consola—, y «parece que se mete» no es «se mete», porque
solapar en un solo eje produce ese aspecto desde un ángulo bajo sin invadir nada.

**Alternativa medida y descartada por el usuario: quitarle el lateral a la
cámara.** El tablero pasó a leerse en profundidad y con `[6.7, 9.5, 9.5]` el
camino se ve **en diagonal**, no vertical; con `[0, 9.5, 9.5]` se lee vertical de
verdad. Se le enseñaron **las dos imágenes** y eligió la diagonal: «justo así
quiero que se vea desde este ángulo». Así que el lateral se queda, y queda
escrito para que nadie se lo vuelva a quitar creyendo que arregla algo. Lo que él
llamaba «vertical» era la columna en los datos, no la lectura en pantalla.

**Y las casillas son cubos**, también suyo y también con la pantalla delante: una
losa de 0,2 se lee como una pegatina sobre el fondo. El cubo mide lo que ocupa
—el paso de la rejilla es 1,0—, así que no hay una segunda medida que mantener, y
se hunde media altura porque la cara de arriba **es** el plano de pisar.

### El estado de cada nivel de la lista sale del progreso real

`LEVEL_TITLES` y el `studentWorlds.find(...) ?? studentWorlds[0]` mueren. El mundo
se resuelve contra las filas de `worlds` por su uuid; los niveles, contra
`levels`; y completado / actual / bloqueado salen de `user_progress`, que la
pantalla de mundos ya lee.

Como nadie escribe progreso hasta el J9, eso deja **el nivel 1 disponible y los
otros dos bloqueados**, que es lo correcto mientras esos dos lleven las filas del
juego anterior. El primer nivel de un mundo está siempre disponible por regla, no
por casualidad: sin eso, un niño sin progreso no podría empezar.

**El candado es de la lista, no de la pantalla de nivel**: escribir la dirección
de un nivel bloqueado lo abre, y si su fila no es legible se topa con el rechazo
del §7. Es deliberado —el candado ordena el avance, no guarda ningún secreto— y
de paso deja el camino del §7 alcanzable a mano mientras los otros ocho niveles
sigan sin rediseñar.

El tono del mundo —que la maqueta traía escrito— pasa a salir de **su posición en
la lista ordenada**, que es el criterio literal que ya usa la pantalla de mundos.

**Y no de su `sort_order`, aunque hoy den lo mismo**: los tres mundos sembrados
llevan `sort_order` 1, 2 y 3, así que las dos reglas coinciden. Son dos reglas
distintas, y el día que se siembre un mundo con otro `sort_order` el mismo mundo
cambiaría de color entre la pantalla de mundos y la de sus niveles **sin que nada
lo delate**.

### La migración actualiza por `(world_id, sort_order)`, y es de datos

El slug cambia, así que **no puede ser la llave por la que se localiza la fila**:
`ruta-del-colibri` no existirá después de aplicarla y volver a ejecutarla no
encontraría nada. La pareja `(world_id, sort_order)` sí sobrevive, y además tiene
índice único propio (`levels_world_sort_order_unique`), así que identifica una
fila y sólo una.

Con eso la migración es **repetible**: un `update` que escribe los mismos valores
deja la fila igual la segunda vez. No lleva `insert`, porque las nueve filas ya
existen.

La igualación de `xp_reward` va en esta misma migración por lo que manda el
roadmap, y es un `update` sin `where`: son los nueve niveles.

**Una migración aplicada no se edita.** Lo que se apruebe antes del `db push` es
lo que queda; corregirlo después cuesta otra migración.

## Risks / Trade-offs

- **El `optimalSteps` no lo comprueba nadie y de él sale la puntuación** →
  Resuelto a mano antes de sembrarlo: 1 × 4 con salida en la columna 0 mirando al
  este y meta en la 3 se resuelve con `avanzar 3`, tres pasos, y por debajo de
  tres no hay nada que quitar. Ni deja el 100 fuera de alcance ni lo regala.
- **El editor deja de publicar de forma intermitente** (`CONTEXT.md` §4.10) y en
  ese estado el juego no se puede jugar → No lo arregla este cambio, pero sí lo
  saca de una ruta de desarrollo: es la primera vez que hay pantalla de producto
  con editor, que es lo que §4.10 decía que no se podía comprobar hasta el J8.
  Toda verificación que dependa del programa mira antes las dos señales que ese
  apartado fija.
- **Ocho niveles quedan sembrados en un formato que el juego rechaza** → Es el
  estado esperado hasta el J7.2 y el J7.3, y el candado de la lista hace que el
  niño no se los encuentre. El rechazo se cubre además con tests del comprobador.
- **Adelantar el J8 mete la pantalla de nivel en un paso que el roadmap dibujaba
  más pequeño** → Decisión del usuario del 11-sep-2026, tomada para no montar el
  mismo trabajo dos veces. Lo que el J8 conserva es conectar el intento, que es
  lo que el J9 y el J10 escriben.
- **El trozo principal engorda con el comprobador y la pantalla nueva** → Son
  módulos puros de unas pocas decenas de líneas; ni `three` ni Blockly cruzan
  hacia arriba, que es la regla que hay que no romper. Se mide en el build.

## Migration Plan

1. Se escribe `supabase/migrations/202606030023_seed_level_1_world_1.sql` y **se
   para ahí**: la sesión revisora lo lee antes de que exista ningún `db push`.
2. **El `db push` lo lanza el usuario**, que es quien tiene las credenciales, y
   sólo después de esa lectura.
3. El código se puede escribir y probar antes de aplicar la migración —el
   comprobador tiene sus tests y la fila vieja ejercita el camino de rechazo—,
   pero **la verificación de punta a punta exige la migración aplicada**.
4. **Vuelta atrás:** no la hay por edición. Una migración aplicada no se toca; si
   el contenido sembrado resulta estar mal, lo corrige otra migración.
