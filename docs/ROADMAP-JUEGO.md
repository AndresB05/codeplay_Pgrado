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
| **J3** | **Fijar el formato** de `config` y de `program` | Está escrito en el contrato, no en la cabeza de nadie | ⬜ |
| **J4** | Blockly con el juego mínimo de bloques: avanzar N, girar a un lado y al otro | Se arrastran bloques y se ve el JSON que producen | ⬜ |
| **J5** | El intérprete: ejecutar el programa, animar al personaje y detectar si llegó a la meta | **Un nivel se resuelve de principio a fin, sin backend** | ⬜ |
| **J6** | Recuento de pasos y pantalla de resultado | Al terminar dice cuántos pasos usó y cuántos eran óptimos | ⬜ |
| **J7** | **Sembrar el mundo 1** — partido en cuatro, uno por nivel más el aspecto | Los tres niveles se juegan leyendo su definición de la base, y el mundo se ve como debe verse | ⬜ |
| J7.1 | Nivel 1: el puzle diseñado, su migración y su siembra | Se juega el nivel 1 leyendo su fila, no el objeto escrito a mano del J2 | ⬜ |
| J7.2 | Nivel 2, igual | Se juega el nivel 2 desde la base | ⬜ |
| J7.3 | Nivel 3, igual | Se juega el nivel 3 desde la base | ⬜ |
| J7.4 | **Assets y diseño del mundo 1** | Los tres niveles dejan los cubos: bloques de rejilla, decorado, cámara y luz, y por último el personaje | ⬜ |
| **J8** | Conectar la pantalla de nivel al backend y montar el juego dentro | Se elige un nivel en la web y arranca el que se eligió | ⬜ |
| **J9** | Mandar el intento al servidor con el programa | La partida aparece guardada en la base | ⬜ |
| **J10** | La migración del XP: contar pasos y conceder por marca de agua | El XP sube 80, y 20 al mejorar. Nunca más de 100 | ⬜ |
| **J11** | La barra de XP por tramos de 300 | El niño sube de nivel al terminar un mundo | ⬜ |
| **J12** | **Mundos 2 y 3** — partido en ocho, con el mismo patrón que el J7 | Hay nueve niveles jugables y los tres mundos vestidos | ⬜ |
| J12.1 · .2 · .3 | Los tres niveles del mundo 2, uno por punto | Cada nivel se juega desde la base en cuanto se cierra su punto | ⬜ |
| J12.4 | Assets y diseño del mundo 2 | El mundo 2 se ve como debe verse | ⬜ |
| J12.5 · .6 · .7 | Los tres niveles del mundo 3, uno por punto | Igual que arriba | ⬜ |
| J12.8 | Assets y diseño del mundo 3 | El mundo 3 se ve como debe verse | ⬜ |

### El apartado gráfico va por mundo, y detrás de lo funcional

Decidido por el usuario el 4-sep-2026, porque **no era de nadie**: los doce pasos
de arriba no tenían ninguno que fuera la cámara, la luz, los modelos o el encaje
con el tema selva de la plataforma. Estaba repartido entre el J2, el J8 y el J12,
que es como un apartado se queda sin hacer.

**La regla es una: primero el mundo funciona, después se viste.** Funcionar es lo
vital —moverse por la rejilla, ejecutar el programa, terminar el nivel—; vestirlo
es una pasada aparte con los modelos de `apps/web/public/models/`. Y dentro de
esa pasada, **primero los assets del nivel y después el del personaje**.

**Y ya tiene número**, decidido el mismo día al partir los pasos de niveles:
**J7.4** para el mundo 1, **J12.4** para el mundo 2 y **J12.8** para el mundo 3.
Cada uno va detrás de los tres niveles de su mundo, que es la regla de arriba
puesta en la secuencia en vez de dejada al criterio de quien llegue.

**Lo que sí hay que respetar desde el J2**, y es la única atadura que deja esta
decisión: **el paso de la rejilla es la constante 1,0 y no se deduce de ningún
modelo.** Medido en los kits: `block-grass` ocupa 1,082 × 1,000 × 1,082 y
`ground_grass` 1,000 × 0 × 1,000. Ese 0,082 es el labio de hierba, que se solapa
a propósito. Código que saque el paso del tamaño del modelo produce rendijas
entre casillas, y con los modelos entrando tarde el fallo aparecería con la
mecánica ya escrita encima.

**El personaje trae 25 animaciones con esqueleto** —`idle`, `walk`, `jump`,
`emote-yes`, `emote-no`—, así que cuando llegue su pasada, el J5 no tiene que
inventar el andar: `@react-spring/three` interpola la posición entre casillas y
el clip mueve las piernas. Hasta entonces, un cuerpo de relleno.

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

El diseño de verdad hace falta en el **J6**, que es el primero que compara contra
un número de pasos óptimo, y se siembra en el **J7.1**.

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

Y arrastra una decisión que conviene tomar a sabiendas: **si se guarda el JSON
nativo de Blockly o uno propio más pequeño.**

- El **nativo** no cuesta código: Blockly serializa y deserializa solo. A cambio,
  el formato es verboso y es de Blockly, así que una actualización suya puede
  cambiarlo.
- Uno **propio** obliga a escribir la traducción en los dos sentidos, pero deja
  un JSON pequeño, estable y fácil de recorrer desde SQL.

Recomendado **el nativo de Blockly**, y por un motivo concreto: el contrato ya
tiene el campo de versión del formato precisamente para sobrevivir a este tipo de
cambios, y escribir un traductor antes de que exista el primer nivel es trabajo
sin evidencia. Si el JSON de Blockly resulta incómodo de recorrer desde SQL en el
J10, ahí se cambia, y con casos reales delante.

**Lo que el formato tiene que garantizar sí o sí**, venga de donde venga: que las
repeticiones sean **números presentes en el programa**. Es lo que permite contar
los pasos sin simular el juego. Está explicado en el contrato §3.

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
