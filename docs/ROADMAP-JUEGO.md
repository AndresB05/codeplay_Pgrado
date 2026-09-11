# CodePlay — Hoja de ruta del juego

> **En qué orden se construye el juego.** Escrita el 3 de septiembre de 2026.

Esto es **sólo el juego**. El orden del proyecto entero está en
[`ROADMAP.md`](ROADMAP.md), y aquí no se repite.

Los dos documentos que hay que tener leídos antes de empezar, y que este roadmap
**no resume**:

| Documento | Qué contiene |
| --- | --- |
| [`DISENO-DEL-JUEGO.md`](DISENO-DEL-JUEGO.md) | Qué es el juego, qué cuenta como un paso y cómo se puntúa |
| [`CONTRATO-DE-INTEGRACION.md`](CONTRATO-DE-INTEGRACION.md) | Qué manda y qué recibe el juego, y qué no debe hacer nunca |

---

## 1. Cómo está ordenada

**Cada paso tiene que poder verse funcionar antes de empezar el siguiente.** Es
el principio que `ROADMAP.md` §2.1 ya aplicó al resto del proyecto, y aquí manda
igual: adelantar un paso para poder comprobar algo es preferible a respetar un
orden escrito antes de saber lo que se sabe al llegar.

De ahí sale la división en cuatro fases, y el motivo de que **el backend entre
tarde a propósito**:

| Fase | Qué se consigue | ¿Necesita la base? |
| --- | --- | --- |
| **A** | El juego se juega entero, con un nivel escrito a mano en el código | No |
| **B** | Los niveles vienen de la base | Sí |
| **C** | El resultado se guarda y da XP | Sí, con migración |
| **D** | El contenido completo | No |

La fase A no toca Supabase ni una vez. Eso es deliberado: **un juego que no se
puede jugar no se arregla conectándolo**, y depurar la mecánica contra una base
de datos es depurar dos cosas a la vez.

---

## 2. Las dos decisiones que bloqueaban el J1 — cerradas el 4-sep-2026

Las decidió el usuario. El detalle y el porqué están en `DISENO-DEL-JUEGO.md` §6
y §5; aquí sólo el resultado:

1. **El juego vive en `apps/web/src/game/`.** No en `packages/`: los tres scripts
   de la raíz —`lint`, `test:run` y `build`— proxean a `-w @codeplay/web` y nada
   más, y el CI corre esos tres, así que un workspace nuevo habría quedado fuera
   de todos ellos desde el primer commit. La frontera del contrato se sostiene
   por convención de carpeta, como ya la sostienen `components/decor/` y el store
   de salones.
2. **Librerías confirmadas, y entran escalonadas.** React Three Fiber para el 3D
   y Blockly para los bloques, **fijadas a React 18**: fiber 9 exige React ≥ 19 y
   el repositorio va con 18.2, así que la pareja es `@react-three/fiber` ^8.18
   con `@react-three/drei` ^9.122. **El J1 instala sólo `three` y
   `@react-three/fiber`**; `drei`, Blockly y `@react-spring/three` entran en el
   paso que primero los importe.

   **Y Blockly queda fijado a ^12.5.1, medido en el J4 contra el instalador.**
   La 13 declara `jsdom >=27.4.0 <30.0.0` como **peer dependency** —es la primera
   versión que saca jsdom de sus dependencias normales— y el repositorio va con
   `jsdom ^30.0.1` para Vitest, así que `npm install blockly` muere con
   `ERESOLVE`. Quien piense en subirla tendrá que mover antes el entorno de los
   tests, y eso es cambiar el banco de pruebas entero por una librería que en el
   navegador no usa jsdom para nada. La 12 no declara ningún peer, aunque se
   trae `jsdom@26.1.0` como dependencia suya: son 77 paquetes en `node_modules`
   y **cero peso en el navegador**, medido.

   **Y `three` queda fijado a ^0.170, medido en el J1 contra el navegador.** Con
   fiber 8.18 contra `three` 0.185 el lienzo se crea y **la escena sale vacía**,
   con un solo aviso de `THREE.Clock` deprecado como indicio. Quien añada `drei`
   en un paso posterior tiene que traerlo a esa misma versión de `three`: **una
   sola copia**, o los `instanceof` de fiber dejan de cuadrar. Y la salida nunca
   es subir fiber, que arrastra React 19.

**Los assets ya no bloquean nada**: salen de [Kenney](https://kenney.nl) y de lo
que cree el propio usuario, en 3D, con 2D donde convenga —iconos de bloques,
interfaz, carteles—. El detalle está en `DISENO-DEL-JUEGO.md` §5.

Y no hace falta esperarlos para empezar: **la fase A se hace entera con cubos de
colores.** Los modelos entran cuando la mecánica ya funciona, que es cuando se
sabe qué piezas hacen falta de verdad.

---

## 3. La secuencia

Estado: ✅ hecho · 🔄 en curso · ⬜ pendiente

| Nº | Paso | Se ve funcionar cuando… | Estado |
| --- | --- | --- | --- |
| **J1** | Esqueleto: las dos dependencias y un componente que pinta una escena 3D vacía dentro de la aplicación, cargado en diferido | Aparece algo en 3D en una pantalla del panel | ✅ |
| **J2** | La cuadrícula y el personaje, montados desde un objeto de configuración **escrito a mano en el código** | Se ve el tablero y el personaje se mueve llamando funciones desde la consola | ✅ |
| **J3** | **Fijar el formato** de `config` y de `program` | Está escrito en el contrato, no en la cabeza de nadie | ✅ |
| **J4** | Blockly con el juego mínimo de bloques: avanzar N, girar a un lado y al otro | Se arrastran bloques y se ve el JSON que producen | ✅ |
| **J5** | El intérprete: ejecutar el programa, animar al personaje y detectar si llegó a la meta | **Un nivel se resuelve de principio a fin, sin backend** | ✅ |
| **J6** | Recuento de pasos y pantalla de resultado | Al terminar dice cuántos pasos usó y cuántos eran óptimos | ✅ |
| J6.1 | **El contador, en vivo**: mientras construye y mientras se ejecuta | ~~El niño ve lo que cuesta su programa sin contar los pasos a ojo~~ — **revertido a medias por el J6.2** | ✅ |
| J6.2 | **Quitar el coste al construir** y llevar el contador a la pantalla del juego | El niño ve subir sus pasos en la esquina, y nada le presiona antes de jugar | ✅ |
| J6.3 | **El ensayo general**: el laboratorio compuesto como estará el nivel, y la cámara movible | Se ve dónde va cada cosa y el mapa se gira y se acerca con el ratón | ✅ |
| J6.4 | **Assets de tanteo** en el laboratorio, para ver por dónde puede ir | Se vio por dónde puede ir, y **no era por ahí**: hecho, no satisfactorio. De él sale mover el apartado gráfico entero al **J13** | ✅ |
| **J7** | **Sembrar el mundo 1** — partido en tres, uno por nivel | Los tres niveles se juegan leyendo su definición de la base | ⬜ |
| J7.1 | Nivel 1: el puzle diseñado, su migración y su siembra | Se juega el nivel 1 leyendo su fila, no el objeto escrito a mano del J2 | ⬜ |
| J7.2 | Nivel 2, igual | Se juega el nivel 2 desde la base | ⬜ |
| J7.3 | Nivel 3, igual | Se juega el nivel 3 desde la base | ⬜ |
| **J8** | Conectar la pantalla de nivel al backend y montar el juego dentro | Se elige un nivel en la web y arranca el que se eligió | ⬜ |
| **J9** | Mandar el intento al servidor con el programa | La partida aparece guardada en la base | ⬜ |
| **J10** | La migración del XP: contar pasos y conceder por marca de agua | El XP sube 80, y 20 al mejorar. Nunca más de 100 | ⬜ |
| **J11** | La barra de XP por tramos de 300 | El niño sube de nivel al terminar un mundo | ⬜ |
| **J12** | **Mundos 2 y 3** — partido en seis, con el mismo patrón que el J7 | Hay nueve niveles jugables | ⬜ |
| J12.1 · .2 · .3 | Los tres niveles del mundo 2, uno por punto | Cada nivel se juega desde la base en cuanto se cierra su punto | ⬜ |
| J12.5 · .6 · .7 | Los tres niveles del mundo 3, uno por punto | Igual que arriba | ⬜ |
| **J13** | **Assets y diseño de los tres mundos**, en una sola pasada y con los nueve puzles jugándose | Los nueve niveles dejan los cubos: suelo, decorado, cámara y luz, y por último el personaje | ⬜ |

### El apartado gráfico va al final, en una sola pasada

Decidido por el usuario el 4-sep-2026, porque **no era de nadie**: los doce pasos
de arriba no tenían ninguno que fuera la cámara, la luz, los modelos o el encaje
con el tema selva de la plataforma. Estaba repartido entre el J2, el J8 y el J12,
que es como un apartado se queda sin hacer.

**La regla es una: primero el mundo funciona, después se viste.** Funcionar es lo
vital —moverse por la rejilla, ejecutar el programa, terminar el nivel—; vestirlo
es una pasada aparte con los modelos de `apps/web/public/models/`. Y dentro de
esa pasada, **primero los assets del nivel y después el del personaje**.

**Y ya tiene número: el J13**, uno solo y detrás de los nueve puzles. Lo decidió
el usuario el 11-sep-2026, al ver lo que dio el J6.4. Antes iba repartido en tres
—uno por mundo, detrás de los niveles de cada uno—, y se juntó por lo que enseñó
ese paso: **el aspecto no se acierta contra un tablero de pega**. Vestir el mundo
1 sin tener delante los otros dos lleva a decidir tres veces lo mismo y a
descubrir a la tercera que la primera estaba mal. Con los nueve niveles
jugándose, la pasada gráfica ve de una vez todo lo que tiene que vestir.

**La regla de arriba no cambia, sólo se aplica una vez**: primero funciona, luego
se viste; y dentro de la pasada, primero los assets del nivel y después el del
personaje.

**Lo que sí hay que respetar desde el J2**, y es la única atadura que deja esta
decisión: **el paso de la rejilla es la constante 1,0 y no se deduce de ningún
modelo.** Medido en los kits: `block-grass` ocupa 1,082 × 1,000 × 1,082 y
`ground_grass` 1,000 × 0 × 1,000. Ese 0,082 es el labio de hierba, que se solapa
a propósito. Código que saque el paso del tamaño del modelo produce rendijas
entre casillas, y con los modelos entrando tarde el fallo aparecería con la
mecánica ya escrita encima.

**El personaje trae 25 animaciones con esqueleto** —`idle`, `walk`, `jump`,
`emote-yes`, `emote-no`—, así que cuando llegue su pasada no habrá que inventar
el andar: el clip mueve las piernas mientras algo interpola la posición entre
casillas. **Eso lo hace hoy el propio J5 con `useFrame`, y `@react-spring/three`
no llegó a entrar**: interpolar entre dos casillas no traía nada nuevo, y el
reloj que anima es el mismo que decide cuándo termina un paso — dos
planificadores para una cosa. La decisión se revisa en el J13, con el modelo
delante, que es donde §2 dice que entran las librerías: en el paso que primero
las importe.

### Los nueve puzles no existen, y los diseña el usuario

`DISENO-DEL-JUEGO.md` §2 lo explica con la prueba delante. Resumen: en la base
hay nueve **títulos** de un juego anterior —el de escribir JavaScript—, no nueve
niveles. Ninguna fila tiene rejilla, salida, meta ni pasos óptimos.

**Ninguna sesión se inventa un puzle.** El J7 y el J12 siembran lo que el usuario
haya diseñado, y no antes. Los títulos se rediseñan con ellos, decidido el
4-sep-2026: el título sale del puzle y no al revés, así que la migración del J7
reescribe además título, narrativa y `validation_rules`.

**Cuándo hace falta el primer diseño, corregido el 4-sep-2026.** Decía aquí que
en el J2, y era pasarse: ese paso monta la cuadrícula desde «un objeto de
configuración escrito a mano», y para eso vale una rejilla de pega —5×5, salida
en una esquina y meta en otra—. De hecho conviene que lo sea: depurar el pintado
del tablero contra un puzle que además importa es depurar dos cosas a la vez.

**El J6 tampoco lo necesita, corregido el 5-sep-2026 por el usuario.** Decía
aquí que el diseño de verdad hacía falta en el J6 por ser el primero que compara
contra un número de pasos óptimo, y no se sigue: comparar contra un número no
exige que ese número sea el de un puzle bueno. El J6 se construye contra
`debugLevel` y su `optimalSteps` de 10 —que es el ejemplo resuelto del contrato
§4.4, y trae de regalo dos programas contados a mano contra los que comprobar el
recuento—. Vale el mismo argumento del párrafo de arriba: verificar el recuento y
la pantalla contra un puzle que además importa es verificar dos cosas a la vez.

El diseño de verdad hace falta en el **J7.1**, que es el primero que lo escribe
en una migración, y no antes.

**Lo que sí había que fijar antes del J2, y lo decidió el usuario el 4-sep-2026:
la rejilla ADMITE huecos y muros.** No es siempre un rectángulo lleno. Los
niveles tipo Lightbot casi nunca lo son, y el mundo 3 ya está señalado como
candidato a «si hay pared, gira»; meterlo después obligaría a rehacer el pintado.

Para el J2 basta un concepto: **cada casilla es transitable o no lo es**. Eso
cubre las dos cosas —un hueco es una casilla que no existe, un muro es una que
existe y no se pisa—, y distinguirlas es cuestión de cómo se pintan, no de la
estructura. **Sin alturas**: el diseño no las menciona en ninguna parte y §3 dice
que un paso es una casilla recorrida o un giro, no un escalón.

El formato definitivo lo fija el J3 igualmente; el del J2 es provisional y a
mano.

**Cuidado con «Puente Condicional»**, el nivel 2 sembrado del mundo 1: pide una
condición, y §3 del diseño avisa de que las condiciones que dependen del entorno
rompen el recuento de pasos —lo señalaba como riesgo del mundo 3—. Al rediseñar
los títulos con los puzles, eso deja de ser un choque; queda anotado para que no
se recupere sin querer.

### J3 es más importante de lo que parece, y por eso va antes que Blockly

El formato del programa **lo leen tres sitios distintos**: el juego para
ejecutarlo, el cliente para contar los pasos que enseña al niño, y el servidor
para puntuar y conceder logros. Si se decide sobre la marcha, los tres divergen.

Y arrastraba una decisión que convenía tomar a sabiendas: **si se guarda el JSON
nativo de Blockly o uno propio más pequeño.**

- El **nativo** no cuesta código: Blockly serializa y deserializa solo. A cambio,
  el formato es verboso y es de Blockly, así que una actualización suya puede
  cambiarlo.
- Uno **propio** obliga a escribir la traducción en los dos sentidos, pero deja
  un JSON pequeño, estable y fácil de recorrer desde SQL.

**Cerrada el 4-sep-2026 a favor del nativo**, que era la recomendación: el
contrato ya tiene el campo de versión precisamente para sobrevivir a este tipo de
cambios, y escribir un traductor antes de que exista el primer nivel es trabajo
sin evidencia. Si el JSON de Blockly resulta incómodo de recorrer desde SQL en el
J10, ahí se cambia, y con casos reales delante.

**Lo que el J3 dejó escrito**, todo en `CONTRATO-DE-INTEGRACION.md` §4:

- **§4.2, `config`**: `tiles`, `start`, `goal` y **`optimalSteps`**, que es el
  número de pasos de la mejor solución. Ese campo cierra además el único punto
  que `DISENO-DEL-JUEGO.md` §6 dejaba abierto — no tenía sitio asignado.
- **§4.3, el programa**: va dentro de un **sobre** `{ formatVersion, workspace }`,
  y el nativo de Blockly va dentro del sobre. El sobre existe porque el intento
  **no tiene ningún hueco propio** para la versión, y `metadata` es otra columna:
  quien lea el programa solo se quedaría sin saber qué está leyendo. Valor único
  hoy: `grid-blockly-1`.
- **§4.4**, las reglas de recuento con un ejemplo resuelto sobre el tablero de
  §4.2 — dos programas que lo resuelven, de 10 y 11 pasos, para que el J6 y el
  J10 tengan contra qué comprobarse.

**El interior del sobre lo registró el J4**, no el J3: Blockly no estaba
instalado —lo instaló ese paso, que es el primero que lo importa—, y transcribir
de memoria la forma que serializa es transcribirla mal. Está en el contrato §4.3,
copiado de una salida real, con el aviso de que **el anidamiento sigue sin
ejemplo**: los tres bloques de hoy son planos y `repetir N veces [cuerpo]` no
existe todavía.

**Lo que el formato tiene que garantizar sí o sí**, venga de donde venga: que las
repeticiones sean **números presentes en el programa**. Es lo que permite contar
los pasos sin simular el juego. Está explicado en el contrato §3 y contado con un
ejemplo en su §4.4.

### El recuento se ve mientras se juega, no sólo al final

**Decidido por el usuario el 7-sep-2026, al ver el J6 terminado.** El J6 enseña
el recuento **al terminar**, y su propuesta dejó fuera el recuento en vivo sin
consultarlo. El criterio del usuario: el niño tiene que poder ver sus pasos **sin
contarlos a mano**, y esperar al final de la animación para saber el número no es
directo. De ahí el **J6.1**.

Son **dos piezas, y se piden las dos**:

- **Mientras construye**: lo que cuesta el programa que hay en el lienzo, contra
  el óptimo del nivel, actualizándose al arrastrar. Sale de `countSteps`, que ya
  existe y no ejecuta nada. Es la lección de eficiencia sin tener que ejecutar.
- **Mientras se ejecuta**: por qué paso va el recorrido, subiendo con el
  personaje. Sale del índice que la escena ya lleva.

**Y la primera tiene que poder retirarse sin tocar la segunda.** Lo pidió el
usuario en la misma decisión: enseñar el coste **antes** de ejecutar es una
elección pedagógica, y **puede cambiar si la profesora lo dicta** — en ese caso
se queda sólo el contador de la ejecución. Así que las dos piezas se montan
independientes: quitar la de construcción tiene que ser borrar una pieza, no
rehacer la barra. Si al implementarlas se enredan, está mal montado.

**Lo que NO se contempla** es la tercera combinación —el coste al construir sin
contador durante la ejecución—: el usuario la descartó por poco práctica. No se
recupera sin volver a preguntárselo.

### Y el coste al construir se retira: el J6.2

**Decidido por el usuario el 7-sep-2026, con el J6.1 ya terminado y delante.**
La pieza de «mientras construye» **se quita**, y con ella el óptimo del nivel
antes de jugar. Su motivo, y manda sobre todo lo de arriba:

> el niño se va a matar la cabeza pensando cómo llegar al final con sólo 10
> pasos en vez de llegar al final

Es un juicio de producto, no de implementación: enseñar el número a batir
**antes** de haber resuelto nada convierte el nivel en un problema de
optimización cuando todavía es un problema de llegar. La eficiencia se aprende
**después** —el resultado del J6 la enseña al terminar, y ahí no presiona—, y la
XP ya premia mejorar en un segundo intento.

**Lo que se va, y es exactamente lo que `design.md` del J6.1 §4 dejó listado**
—la pieza se montó separada para esto—: el requisito del coste al construir,
`programCost` con su bloque de tests, y en `GameScene.tsx` el `useMemo`, la línea
del coste y el aviso de sueltos **en presente**. No se toca nada de lo que se
queda.

**Lo que se queda y cambia de sitio: el contador de la ejecución.** No va en la
barra de texto sino **dentro de la pantalla del juego, arriba a la derecha**,
subiendo un número con cada paso que da el personaje. Y va **solo, sin el
óptimo al lado**: enseñar «7 de 10» mientras corre es la misma presión que se
acaba de retirar, con otra letra.

**Ojo al montarlo**: ese contador NO puede vivir dentro del `<Canvas>`, donde los
elementos son objetos de `three` y no etiquetas de HTML. Va superpuesto sobre el
lienzo, que es un detalle de maquetación y no de escena.

**Lo que NO cambia**: el resultado del J6 al terminar, con los pasos usados
contra los de la mejor solución. Ahí el número es una lección y no una
exigencia, y el usuario no lo ha discutido.

### El editor va al lado del juego, y eso es del J8

**Decidido por el usuario el 5-sep-2026, y hasta hoy no estaba escrito en
ninguna parte.** Cuando exista la pantalla de nivel real, **el editor de bloques
va en el mismo cuadro que el juego, a la derecha** — no en tarjetas apiladas,
que es como están hoy en el laboratorio.

Hoy la escena y el editor son dos `card` una debajo de otra en
`StudentGameLabModule.tsx`, cada una de 420 px de alto. Eso está bien para un
banco de pruebas —donde además hay que ver el JSON que sale—, y está mal para
jugar: el niño arrastra un bloque arriba y el resultado ocurre fuera de la
pantalla, así que no puede ver lo que su programa hace mientras lo escribe.

**Va en el J8** (paso 20 del roadmap principal), que es el que monta esa
pantalla, y **no en el J6**: el J6 se sigue viendo funcionar en el laboratorio,
con las tarjetas como están. Mover la maquetación antes de que exista la
pantalla que la necesita es rehacerla dos veces.

La barra de controles no se reescribe: vive dentro de `GameScene.tsx` a
propósito, debajo del `<Canvas>`, para que la pantalla del J8 la herede.

### El ensayo general antes de sembrar: J6.3 y J6.4

**Pedidos por el usuario el 7-sep-2026, con la fase A terminada.** Van **antes
del J7** y con un boceto suyo delante. El motivo es el orden de los errores:
sembrar tres niveles y descubrir **después** que la pantalla se compone de otra
manera obliga a rehacer lo que ya está en la base.

**El número dice cuándo, no de qué son.** Cuelgan del J6 porque van detrás de él
y antes del J7, y meter números nuevos entre los dos obligaría a renumerar — que
es lo único que este roadmap no hace, porque los números se citan desde
`CONTEXT.md` y desde los cambios archivados.

**J6.3 — la composición, no el aspecto.** Se reordena el laboratorio para que
quede como estará la pantalla de nivel: el juego arriba a la izquierda con el
contador de pasos en su esquina, debajo el lienzo donde se encadenan los bloques,
y a la derecha la caja de bloques, los tres botones —**ejecutar, detener y
reiniciar**— y un panel de instrucciones. **Sin assets**: siguen los cubos.

**Y el mapa se mueve con el ratón**: girar y acercar. Es lo único del paso que no
es maquetación.

**J6.4 — assets de tanteo.** Meter modelos de `apps/web/public/models/` en el
laboratorio **para ver por dónde puede ir**, no para dejarlo hecho. El apartado
gráfico de verdad es el **J13**, con la regla de arriba: primero el nivel,
después el personaje.

**Y lo que salió, que es por lo que el J13 existe.** El paso está **hecho y no
satisfactorio**, dicho por el usuario el 11-sep-2026: se cambiaron los kits
—fuera el Nature, dentro el Survival—, el suelo pasó a ser una sola pieza con su
damero y su canto de tierra, y entraron los obstáculos y el escenario de fuera;
pero **el resultado no es el que se buscaba**, y se paró ahí, sin la decoración
ni el personaje. De ese hallazgo sale mover el apartado gráfico entero detrás de
los nueve puzles: **el aspecto no se acierta contra un tablero de pega**, y lo
que se tantea sobre la rejilla de prueba no se parece a lo que hay que vestir.
Lo que sí sobrevive del paso son las piezas que no son estética —los modelos
pedidos por URL sin entrar al empaquetado, el límite de error que evita que un
modelo que no llega se lleve la aplicación, y las medidas del kit— y están en
`CONTEXT.md` §2.9.

**Cuatro cosas que este par se encuentra, y ninguna estaba escrita:**

1. **Entra `drei`, y es el paso que primero lo importa** — justo como §2 lo dejó
   previsto: `^9.122`, y sólo si `OrbitControls` hacía falta. Hace falta. Va con
   sus dos trampas ya medidas: **una sola copia de `three`** en 0.170, o los
   `instanceof` de fiber dejan de cuadrar; y **el lockfile se restaura, nunca se
   regenera** — regenerarlo en Windows se lleva los binarios de
   `@supabase/cli-linux-*` y el CI corre `npm ci` sobre ubuntu.
2. **La caja de bloques y el lienzo son la MISMA inyección de Blockly.** Hoy
   `TOOLBOX` es un `categoryToolbox` de una categoría, y el desplegable pertenece
   al espacio inyectado: ponerlos en dos zonas distintas de la pantalla **no es
   CSS**, es cambiar cómo se monta el editor. Es el riesgo del J6.3 y conviene
   medirlo antes de prometer la maqueta entera.
3. **El contador se ve SIEMPRE, no sólo mientras corre**, confirmado por el
   usuario el 7-sep-2026: sin ejecución en marcha dice **«Pasos: 0»**, y ahí se
   queda hasta que se pulse «Ejecutar». Hoy el chip aparece y desaparece con
   `isRunning`, así que esto cambia su condición y su texto —el sitio, arriba a la
   derecha del juego, ya es el bueno—. **No choca con el J6.2**: lo que aquél
   retiró fue el **número a batir** antes de jugar, y un cero no lo es; al revés,
   un marcador que ya está puesto explica de qué van a ser los números que suban.
4. **«Detener» no existe.** Hoy hay «Ejecutar» y «Reiniciar»; parar a mitad de un
   recorrido es comportamiento nuevo, no un botón más.

**Y el panel de instrucciones es de relleno aquí.** En el nivel real ese texto
sale de la narrativa de la fila (J8); en el laboratorio se escribe a mano y no se
inventa contenido de producto.

### Las migraciones y sus paradas

`ROADMAP.md` §1.3 punto 9: **el SQL se lee antes de aplicarlo, y quien hace
cumplir esa parada es el usuario**, porque sólo él lanza `supabase db push`. No
se lanza hasta que la sesión que revisa haya leído el SQL y lo haya dicho.

**Partir el J7 multiplica sus paradas: son tres, no una.** Una migración aplicada
no se edita, así que cada nivel que se cierre por separado trae su propia
migración y su propia lectura previa. Es más ceremonia y es el precio de ver un
nivel funcionando antes de diseñar el siguiente.

- **J7.1, J7.2 y J7.3** siembran, cada una, el puzle de su nivel en
  `levels.validation_rules` y reescriben su título, su narrativa y su
  `starter_code`, que hoy son de otro juego. La primera de las tres iguala además
  `xp_reward` a 100 en los nueve niveles, que hoy está sembrado con 100, 120,
  140, 180, 200, 240 y 260.

  **Dos cosas del formato que muerden justo aquí**, las dos del contrato §4.2.
  La primera: el `optimalSteps` de cada nivel **no lo comprueba nadie**, y la
  puntuación se calcula contra él, así que uno escrito por debajo del óptimo real
  deja el 100 fuera del alcance de cualquier niño **sin que salte ningún error**
  — hay que resolver el puzle a mano antes de sembrarlo. La segunda: el tablero
  es **rectangular**, y los huecos se escriben `'gap'`, nunca acortando una fila;
  una fila corta se juega como borde del tablero y no como hueco, y al niño se le
  dice otra cosa.
- **J12** repite el patrón seis veces más, una por nivel de los mundos 2 y 3.
- **J10** es la de fondo, y la que `ROADMAP.md` §3.2 ya describe: hoy
  `upsert_my_progress` concede el XP **una sola vez**, así que un segundo intento
  perfecto suma cero. Hay que pasar a conceder por diferencia de marca, y a
  calcular la puntuación contando el programa en vez de creerse la que llegue.

### Qué comparte con el roadmap principal

Tres pasos de aquí son la cara «juego» de pasos que ya existen allí. **No son
trabajo duplicado: son el mismo trabajo mirado desde el otro lado**, y conviene
cerrarlos a la vez para que no se queden a medias:

| De aquí | Es el paso… |
| --- | --- |
| J8 | **20** — pantalla de nivel, ruta y conectar la selección al backend |
| J9 y J10 | **21** — escritura de progreso y XP desde el juego |
| J11 | Hereda del **28**, que puso la barra, y del **22**, que fija el máximo |

Y lo que **no** entra aquí, aunque lo parezca: los **logros** y las **misiones**
son el paso 22, y el juego no participa. No los nombra, no los reporta y no sabe
que existen. Si algún paso de este roadmap se ve haciéndolo, se salió del
contrato.

---

## 4. Lo que este roadmap da por hecho y no lo está

Escrito para que no se descubra a mitad:

- **El mundo 3 puede necesitar condiciones que dependan del entorno** —«si hay
  pared, gira»—, y ese día el recuento de pasos deja de poder calcularse leyendo
  el programa. Está anotado en `DISENO-DEL-JUEGO.md` §3. Si el J12 llega ahí, la
  decisión se toma entonces, no se improvisa.
- **El juego debe cargarse sólo en la pantalla de nivel**, con importación
  dinámica. El bundle ya avisa de que pasa de 500 kB y el motor 3D más Blockly
  suman bastante más. Es una línea, y se pone en el J1 o no se pone nunca.
- **Nada de lo escrito hoy en `apps/web` llama a `create_level_attempt` ni a
  `upsert_my_progress`.** Las dos funciones existen y están medidas contra la
  base real, pero desde la aplicación no las usa nadie: el J9 es la primera vez.
  El detalle está en el apéndice del contrato.
