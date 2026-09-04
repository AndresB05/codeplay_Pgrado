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

> **Nueve es exactamente lo que ya hay sembrado en la base**, tres por mundo,
> desde el primer día, así que **no falta crear ningún nivel**. Los temas de los
> sembrados —bucles, condicionales, funciones, recursión— son ámbitos del
> pensamiento computacional igualmente, así que no contradicen nada: afinar sus
> títulos para que acompañen mejor a cada mundo es cosmética, no trabajo
> pendiente.

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

### La barra de XP cambia

Hoy la barra del panel del niño va contra un máximo provisional inventado
(`PROVISIONAL_MAX_XP = 1000`). Pasa a marcar **tramos de 300 XP**:

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

Así la barra funciona hoy —con sólo los 900 de los niveles llega hasta el tramo
3— y **sigue funcionando cuando los logros añadan XP**, sin volver a tocarla ni
tener que inventar un techo. El máximo real saldrá de sumar el catálogo cuando
exista, en vez de fijarse a dedo ahora.

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
   quedan unos pocos modelos `.glb` de kilobytes. **Por eso el juego se queda en
   este monorepo**, decidido el mismo día.
3. **Desaparece «instalar Unity»** como paso que requiere una persona.

Lo que **no** cambia: sigue siendo 3D y sigue teniendo que **cargar assets**.

### Librerías recomendadas, pendientes de confirmar

| Para | Recomendación | Por qué |
| --- | --- | --- |
| 3D | **React Three Fiber** + `drei` | Es Three.js como componentes de React, así que el juego encaja dentro de la aplicación que ya existe. `drei` trae cámaras, controles y cargadores ya hechos |
| Bloques | **Blockly** | Serializa el programa a **JSON de forma nativa**, que es justo lo que el contrato exige. Es lo que hay detrás de Code.org |
| Assets | **glTF / GLB** | Formato estándar, con cargador incluido en Three. Modelos libres en Kenney y Quaternius |
| Animación | `@react-spring/three` | Para el movimiento del personaje. Nada más pesado hace falta |

Descartadas: **Babylon.js** (integra peor con React y no hacen falta físicas: el
personaje se mueve por casillas) y **Scratch Blocks** (más pesado y más opinado
que Blockly para embeberlo en una pantalla propia).

**Aviso de tamaño:** el bundle ya supera los 500 kB y el build lo avisa. Three
más Blockly suman bastante más, así que **el juego debe cargarse sólo en la
pantalla de nivel**, con importación dinámica. Es una línea, pero hay que
acordarse.

## 6. Lo que este diseño deja sin decidir

1. **¿Contra qué se compara para saber si un intento fue perfecto?** El número de
   pasos óptimo de cada nivel tiene que estar escrito en alguna parte —lo natural
   es junto a la definición del puzle— y definido a mano al diseñar el nivel.
2. **¿De dónde salen los modelos 3D?** La decisión de generar ilustraciones con
   Higgsfield era para 2D; los modelos 3D son otra cosa.
3. **¿Dónde vive el juego dentro del monorepo?** Ya no es un proyecto aparte.
   `packages/game/` mantiene la frontera que el contrato describe;
   `apps/web/src/game/` es más simple. Recomendado el primero: trabajando solo,
   esa frontera es lo que impide que el juego acabe sabiendo de logros y
   misiones.
4. **Confirmar las librerías** de §5, que están recomendadas y no elegidas.

**Cerradas el 3-sep-2026**, y quedan escritas arriba: qué cuenta como un paso
(§3), cómo se reparten los tramos de la barra de XP (§3), y que los tres mundos
tocan ámbitos distintos del pensamiento computacional sin cambiar de estructura
(§2).
