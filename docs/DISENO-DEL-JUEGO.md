# CodePlay — Diseño del juego

> **Qué es el juego, cómo se juega y cómo se puntúa.**
> Decidido en la socialización del proyecto del **3 de septiembre de 2026**.

Este documento es la fuente de verdad del *diseño* del juego. Los otros
documentos remiten aquí en vez de repetirlo:

| Documento | Qué dice del juego |
| --- | --- |
| **Este** | Qué es el juego y cómo se puntúa |
| [`CONTRATO-DE-INTEGRACION.md`](CONTRATO-DE-INTEGRACION.md) | Qué manda y qué recibe, en qué formato. **Escrito para quien no conoce el repositorio** |
| [`ROADMAP.md`](ROADMAP.md) | En qué orden se construye |

---

## 1. Qué es

Un juego **3D en el navegador** donde un personaje va del **punto A al punto B**
sobre una cuadrícula, y el niño lo dirige **programando con bloques**. La
referencia es **Lightbot**.

**El patrón es el mismo en los tres mundos.** No hay tres juegos distintos: hay
una mecánica y tres conjuntos de retos. Eso es deliberado —lo simplifica todo— y
significa que construir el mundo 1 es construir el motor de los tres.

**Sin Unity.** Se hace con librerías de JavaScript dentro de la aplicación web
que ya existe. La decisión y lo que ahorra están en §5.

## 2. Los tres mundos

**Los tres mundos tocan ámbitos distintos del pensamiento computacional, pero
mantienen exactamente la misma estructura de juego.** No cambia la mecánica de un
mundo a otro: cambia qué tiene que pensar el niño para resolverlo.

| Mundo | Ámbito |
| --- | --- |
| 1 | Algoritmos y reconocimiento de patrones |
| 2 | Descomposición y abstracción |
| 3 | Evaluación de problemas |

**Tres niveles por mundo, nueve en total.** Se redujo de diez a tres el
3-sep-2026 para que el alcance sea abarcable por una sola persona, que es quien
está haciendo la página, la documentación y el juego.

> **En la base hay nueve filas, no nueve niveles**, y la diferencia importa.
> Corregido el 4-sep-2026 leyendo la migración 0012: decía aquí que «no falta
> crear ningún nivel», y era cierto de las filas y falso de los puzles.
>
> Lo sembrado es de **otro juego**, el de escribir JavaScript que se descartó. Sus
> `validation_rules` dicen `requiresAsyncAwait`, `requiresRecursion`,
> `requiresArray`, `requiresDebugging`; su `starter_code` es texto JS
> (`const pasos = []…`). **No hay ni una rejilla, ni una casilla de salida, ni una
> meta, ni un número de pasos óptimo.** Lo que existe son nueve títulos, nueve
> narrativas y la identidad colombiana de los tres mundos.
>
> **Los nueve puzles hay que diseñarlos, y los diseña el usuario.** Decidido el
> 4-sep-2026, y con ellos se rediseñan los títulos: el título sale del puzle y no
> al revés. Eso convierte la migración del J7 en una que además reescribe título,
> narrativa y `validation_rules`, no sólo en una que siembra configuración.

## 3. Cómo se puntúa

**La XP premia la eficiencia, no el esfuerzo.** Cuantos menos pasos use el niño
para llegar al punto B, más gana. La idea es que busque la solución corta, no que
repita el nivel para acumular.

### El tope y la marca de agua

| Concepto | Valor |
| --- | --- |
| Tope por nivel | **100 XP** |
| Por mundo (3 niveles) | **300 XP** |
| Total, todo perfecto | **900 XP** |

**La XP de un nivel no se acumula: se completa hasta su tope.** Si el primer
intento sale decente pero no perfecto y da 80, un segundo intento perfecto **sólo
suma los 20 que faltaban**. Un intento peor que el anterior no resta ni suma.

Esto **no** se implementa llevando la cuenta de lo ya concedido. El esquema ya
tiene la pieza: la columna `best_score` está acotada de 0 a 100 y **nunca baja**,
porque guarda la mejor marca histórica del niño en ese nivel. Con eso la regla
cabe en una línea:

> **XP concedida = (marca nueva − marca anterior) × tope del nivel ÷ 100**

Primer intento al 80 % → 80. Segundo al 100 % → 20. Tercero al 60 % → 0. Nunca
se pasa del tope, y no hace falta ninguna columna nueva.

**Aplicado el 17-sep-2026 por el J10**, con la migración `202606030033`. La regla
la concede `upsert_my_progress`, que hasta ese día daba el tope entero al pasar a
completado y cero después.

### De pasos a puntuación, el eslabón de en medio

**Esto faltaba, y es lo que decide cuánta XP da cada partida.** La marca de agua
dice qué se hace con una puntuación; lo que no estaba escrito en ninguna parte era
de dónde sale esa puntuación. Decidido el 17-sep-2026:

> **puntuación = redondeo(100 × pasos de la mejor solución ÷ pasos usados)**

Los pasos justos dan **100**, y cada paso de más resta tanto más cuanto más corto
sea el nivel — en el primero, que se resuelve en cuatro, un bloque olvidado cuesta
20 puntos; en uno de veinticinco, cinco—. Y hay un **suelo de uno**: resolver el
nivel nunca puntúa cero, porque cero es lo que vale no haberlo resuelto y las dos
cosas no pueden decirse con el mismo número.

**Se eligió tras medir tres reglas** contra los nueve programas resueltos a mano
y sus excesos —un giro olvidado detrás de la meta, dos, un «avanzar 3» de sobra y
el programa duplicado, todos comprobados con el intérprete para confirmar que
siguen superando el nivel—:

| Regla | Nivel de óptimo 4 | Nivel de óptimo 10 | Nivel de óptimo 25 |
| --- | --- | --- | --- |
| **Proporcional**, la elegida | 100 · 80 · 67 · 57 · 50 | 100 · 91 · 83 · 77 · 50 | 100 · 96 · 93 · 89 · 50 |
| Lineal, cero al doble | 100 · 75 · 50 · 25 · 0 | 100 · 90 · 80 · 70 · 0 | 100 · 96 · 92 · 88 · 0 |
| Diez por paso | 100 · 90 · 80 · 70 · 60 | 100 · 90 · 80 · 70 · 0 | 100 · 90 · 80 · 70 · 0 |

*(exacta, +1 paso, +2, +3, programa duplicado)*

Gana la proporcional porque **es literalmente la eficiencia** que este apartado
dice premiar, porque **superar siempre paga algo** —que para el niño más pequeño
importa más que castigar el bloque olvidado— y porque reproduce sola el ejemplo de
arriba: 80 en la primera pasada y 20 al mejorarla. Su precio, aceptado a
sabiendas: es la más dura con el primer nivel, donde el óptimo son cuatro pasos.

**Sólo puntúan las partidas con éxito.** Fallar puntúa cero por eficiente que sea
el programa, porque la puntuación mide cómo se resolvió el nivel y no cómo se
falló. Con la regla anterior eso lo garantizaba la transición a completado; con la
marca de agua hay que decirlo aparte.

### Qué cuenta como «un paso»

**Un paso es una casilla recorrida o un giro.** El terreno es una cuadrícula:
`avanzar 4` son **cuatro pasos**, porque el personaje recorre cuatro casillas.
`girar` es **un paso**, y ocurre sin cambiar de casilla.

O sea que **se cuentan los movimientos, no los bloques**. `repetir 4 veces
[avanzar]` son cuatro pasos aunque sean dos bloques.

**Eso no obliga a simular el juego dentro del servidor**, que es lo que habría
encarecido esto. Mientras las repeticiones sean números escritos en el programa
—`avanzar 4`, `repetir 3 veces`—, el total sale de **recorrer el programa
sumando**, sin saber nada del terreno ni de dónde está el personaje. Es una
función recursiva sobre el JSON, no un motor de juego.

> **Dónde se rompería, y conviene verlo venir.** Si algún nivel introduce
> condiciones que dependen del entorno —«si hay pared, gira»—, el número de pasos
> deja de poder calcularse leyendo el programa: depende de lo que pase al
> ejecutarlo. El mundo 3 es el candidato natural a necesitar eso. Si llega ese
> día, las salidas son que el juego reporte el recuento, o puntuar ese mundo por
> otra cosa que no sean los pasos.

### Quién calcula la puntuación

**El servidor, contando el programa que el juego le manda.** No se cree una
puntuación que le llegue hecha.

No es desconfianza hacia el niño: es que **el servidor ya tiene que leer ese
programa de todos modos** para conceder logros, y contando ahí no se escribe la
misma lógica dos veces. Que además cierre la puerta a que alguien se ponga la XP
que quiera desde la consola del navegador es un efecto secundario, no el motivo.

**Cumplido el 17-sep-2026, y cuesta dos funciones de SQL.** `count_program_steps`
recorre el JSON del programa y `score_for_steps` aplica la regla, las dos dentro
de la base. El juego **sí** enseña su propia puntuación al terminar —la ventana no
espera al guardado—, con la misma regla y el mismo recuento, y la suya se guarda
con el intento al lado de la del servidor: el día que dejen de coincidir, queda
con qué darse cuenta. La que cuenta sigue siendo la del servidor.

### La barra de XP cambia — hecho, y se llama «Nivel Explorador»

**Aplicado el 17-sep-2026 por el J11.** La barra iba contra un máximo provisional
inventado (`PROVISIONAL_MAX_XP = 1000`), que ya no existe. Marca **tramos de 300
XP**:

```
   nivel 1        nivel 2        nivel 3        …
   0 ─── 300 ──── 300 ─── 600 ── 600 ─── 900 ──▶
```

**Se sube de tramo cada 300 XP**, que es exactamente lo que da un mundo entero
completado a la perfección. Es la regla que mejor se le explica a un niño:
*terminas un mundo bien, subes de nivel.* La alternativa de subir cada 100 haría
que cada nivel jugado diera un tramo, lo que infla el número rápido y le quita
significado.

**No hay tope fijo, y es deliberado.** Los nueve niveles dan 900 como máximo,
pero **los logros y las misiones también reparten XP**, y cuánta no se sabrá
hasta que exista el catálogo de logros (paso 22 del roadmap). Por eso el tramo se
calcula, no se enumera:

> **tramo = parte entera de (XP total ÷ 300) + 1**

Así la barra funciona hoy y **sigue funcionando cuando los logros añadan XP**,
sin volver a tocarla ni tener que inventar un techo. El máximo real saldrá de
sumar el catálogo cuando exista, en vez de fijarse a dedo ahora.

**Con los nueve niveles perfectos se estrena el tramo 4, no se termina el 3.** Los
900 caen justo en el borde: `900 ÷ 300` es 3 y el tramo es el siguiente. Medido en
pantalla el 17-sep-2026, con la cuenta de pruebas en 900: «Nivel Explorador 4,
0 / 300 XP», con la barra vacía. Es lo que hay que esperar, no un fallo de
redondeo — el tramo cuenta lo que llevas dentro, y de un mundo perfecto no sobra
nada.

**Se llama «Nivel Explorador», decidido por el usuario**, y no «nivel» a secas:
en la misma pantalla hay «Nivel 3 - La escalera», que es otra cosa y también se
numera. Empieza en **1** con cero XP, porque nadie está en el nivel cero.

**Dónde se ve:** el niño, en la barra lateral, en la barra superior y en su
pantalla de cuenta. El tutor, en la tabla de seguimiento, **con el XP acumulado
al lado**: la barra sola ordena mal, porque se vacía al subir, y quien mira esa
tabla es justo quien tiene que comparar. Y la ventana de nivel superado **celebra
la subida** cuando ocurre.

## 4. Lo que el juego NO decide

Está en el contrato y se repite aquí porque es lo que hace que el juego no haya
que volver a publicarlo cada vez que cambia el contenido:

- **No trae la lista de niveles: la recibe.** Añadir un nivel debe costar una
  fila en la base, no una versión nueva del juego.
- **No decide cuánta XP se gana.** Manda el intento; el servidor puntúa.
- **No nombra logros ni misiones.** Ni siquiera sabe que existen.
- **El programa de bloques se serializa en JSON**, para que el servidor pueda
  leerlo. Es la decisión irreversible del contrato.

## 5. Sin Unity, y qué ahorra

Se descartó Unity el 3-sep-2026 en favor de librerías existentes, por facilidad
de integración. Ahorra tres cosas de golpe:

1. **Desaparece el puente.** El contrato describía tres piezas —el juego, la
   página que lo incrusta y el servidor— porque un build de WebGL es un programa
   ajeno a la página y sólo puede hablar con ella por mensajes. Siendo una
   librería, **el juego es un componente más de la aplicación React**: sin
   iframe, sin `postMessage`, sin build que copiar a `public/game/`.
2. **Desaparece el problema de Git LFS.** Era el único argumento fuerte para
   sacar el juego a un repositorio propio: encenderlo obligaba a todo el equipo a
   instalar `git-lfs`. Sin Unity no hay escenas, ni prefabs, ni `Library/`;
   quedan sólo modelos `.glb`. **Por eso el juego se queda en este monorepo**,
   decidido el mismo día. Los dos kits ya están dentro y suman **5,96 MB**: se
   dijo «unos pocos de kilobytes» y son 482 archivos, pero el argumento aguanta
   igual, porque eso sigue siendo dos órdenes de magnitud por debajo de lo que
   justificaría encender LFS.
3. **Desaparece «instalar Unity»** como paso que requiere una persona.

Lo que **no** cambia: sigue siendo 3D y sigue teniendo que **cargar assets**.

### Librerías — confirmadas el 4-sep-2026

| Para | Elección | Por qué |
| --- | --- | --- |
| 3D | **React Three Fiber** + `drei` | Es Three.js como componentes de React, así que el juego encaja dentro de la aplicación que ya existe. `drei` trae cámaras, controles y cargadores ya hechos |
| Bloques | **Blockly** | Serializa el programa a **JSON de forma nativa**, que es justo lo que el contrato exige. Es lo que hay detrás de Code.org |
| Assets | **glTF / GLB** | Formato estándar, con cargador incluido en Three. Ver abajo de dónde salen |
| Animación | `@react-spring/three` | Para el movimiento del personaje. Nada más pesado hace falta |

**Fijadas a React 18, y no por conservadurismo.** `@react-three/fiber` 9 —la
versión viva— exige React ≥ 19 en sus `peerDependencies`, y este repositorio va
con React 18.2. La combinación que funciona hoy sin tocar nada es
**`@react-three/fiber` ^8.18 con `@react-three/drei` ^9.122**. Subir a React 19
para poder usar fiber 9 arrastraría `react-dom`, los tipos, Testing Library y los
109 tests: no está en ningún roadmap y nada de esto lo necesita.

**Y entran escalonadas.** El J1 instala sólo `three` y `@react-three/fiber`;
`drei` entra cuando haga falta una cámara o un cargador, Blockly en el J4 y
`@react-spring/three` en el J5. Una dependencia que nadie importa es peso en el
bundle sin evidencia de que se necesite —y §5 ya avisa de que el bundle va justo—.

Descartadas: **Babylon.js** (integra peor con React y no hacen falta físicas: el
personaje se mueve por casillas) y **Scratch Blocks** (más pesado y más opinado
que Blockly para embeberlo en una pantalla propia).

### De dónde salen los assets — decidido el 3-sep-2026

**De [Kenney](https://kenney.nl) y del propio usuario**, que crea los que hagan
falta. Son **3D**, que es lo que pide el juego, y **también se usará 2D donde
convenga** —iconos de los bloques, interfaz del editor, carteles— sin que eso
contradiga nada: el 3D es el terreno, no la pantalla entera.

Kenney encaja bien porque su estilo de cubos con colores planos es el mismo del
que hablan las decisiones visuales del proyecto, y su licencia es libre.

**No lo cubre Higgsfield.** Esa decisión era para las ilustraciones 2D de la
plataforma —la mascota, las portadas de mundo—, que es otra cosa y sigue en pie
por su lado.

### Y ya están en el repositorio — 4-sep-2026

Los dos kits que aportó el usuario viven en **`apps/web/public/models/`**, con su
`README.md` al lado explicando el detalle. Lo que conviene saber sin abrir esa
carpeta:

- **`nature/`** (Nature Kit 2.1, 329 modelos) es el decorado —árboles,
  acantilados, caminos, puentes— y **`platformer/`** (Platformer Kit 4.1, 153) es
  el juego: cinco personajes, 39 variantes de bloque de rejilla, bandera de meta,
  flechas, puertas y llaves. Los dos son **CC0**.
- **Sólo se guardó el GLB.** El FBX, el OBJ, el DAE, el STL y las ~1.800 vistas
  previas se quedaron fuera: son unos 30 MB que el navegador no sabe leer.
- **Van en `public/` y no en `src/`** porque `GLTFLoader` los pide por URL en
  tiempo de ejecución. Metidos en `src/` entrarían en el grafo del bundle, que es
  lo contrario de lo que se quiere.
- **`platformer/Textures/colormap.png` no se puede mover.** Los 153 modelos de
  ese kit apuntan a él por ruta relativa, así que tiene que seguir siendo hermano
  de los `.glb`. Aplanar la carpeta los deja en blanco **sin error en consola**.
  Los 329 de `nature/` sí son autocontenidos. Comprobado en los 482, uno a uno.

Estar en el repositorio **no es entrar en el juego**: `ROADMAP-JUEGO.md` §2 sigue
mandando, y la fase A se hace entera con cubos de colores. Están ahí para no
tener que buscarlos el día que hagan falta.

**Aviso de tamaño:** el bundle ya supera los 500 kB y el build lo avisa. Three
más Blockly suman bastante más, así que **el juego debe cargarse sólo en la
pantalla de nivel**, con importación dinámica. Es una línea, pero hay que
acordarse. Los modelos cuentan aparte y conviene vigilarlos: es fácil meter un
`.glb` de varios megas sin darse cuenta.

## 6. Lo que este diseño deja sin decidir

**Ya no queda nada.** La última que había —**¿contra qué se compara para saber si
un intento fue perfecto?**— la cerró el **J3 el 4-sep-2026**, y con lo que este
documento apuntaba: el número de pasos óptimo va **junto a la definición del
puzle**, en el campo `optimalSteps` de `config`, y se define a mano al diseñar el
nivel. Está fijado en
[`CONTRATO-DE-INTEGRACION.md`](CONTRATO-DE-INTEGRACION.md) §4.2, con el porqué —
y en su §4.4 con un ejemplo resuelto de en qué se convierte al puntuar.

**Cerradas el 4-sep-2026** por el usuario, y escritas arriba: **el juego vive en
`apps/web/src/game/`** y **las librerías de §5 quedan confirmadas**.

Dónde vive lo decidió un dato que no estaba escrito en ninguna parte: los tres
scripts de la raíz —`lint`, `test:run` y `build`— proxean a `-w @codeplay/web` y
nada más, y el CI corre esos tres. Un workspace en `packages/` habría quedado
fuera de los tres, y del CI, desde el primer commit; además `apps/web/tsconfig.json`
declara `include: ["src"]`, así que `tsc` tampoco lo habría mirado. La frontera
que justificaba sacarlo ya se sostiene por convención en dos sitios de este
repositorio —`components/decor/` y el store de salones—, sin ayuda del sistema de
módulos.

**Cerradas el 3-sep-2026**, y quedan escritas arriba: qué cuenta como un paso
(§3), cómo se reparten los tramos de la barra de XP (§3), que los tres mundos
tocan ámbitos distintos del pensamiento computacional sin cambiar de estructura
(§2), y de dónde salen los assets (§5).
