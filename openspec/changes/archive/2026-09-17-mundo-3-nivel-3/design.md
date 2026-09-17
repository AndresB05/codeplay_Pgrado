## Context

Ver `proposal.md` — Why. El método es el de `mundo-3-niveles-1-y-2`, archivado en
`openspec/changes/archive/2026-09-16-mundo-3-niveles-1-y-2/`. Aquí sólo lo propio
de este cambio.

## Goals / Non-Goals

**Goals:** que el nivel 3 del mundo 3 se juegue desde su fila, con su máximo de
pasos, y que el J12 quede cerrado.

**Non-Goals:** el paso del coyote; el XP; tocar los ocho niveles ya sembrados.

## Decisions

### La dificultad de este mundo se mide en caminos, no en pasos

**Lo fijó el usuario el 17-sep-2026**, y es la decisión que hay que tener delante
para no «arreglar» este nivel en el futuro. Se le dijo que su nivel 3 costaba
menos que el 2 —12 contra 17— y que eso lo dejaba corto para cerrar el mundo. Su
respuesta: «el punto de la dificultad de este mundo no es la cantidad de pasos,
sino de caminos, complicando al usuario tomar decisiones sobre qué camino es más
eficiente y correcto».

Medido, los tres quedan así:

| | Pasos | Caminos óptimos |
| --- | --- | --- |
| Nivel 1 — Dos caminos | 10 | 1 |
| Nivel 2 — El faro | 17 | 2 |
| Nivel 3 — Muchos caminos | 14 | 2 |

Leída sólo por ese número la progresión no sube, y no pasa nada: lo que este
nivel aporta no son caminos óptimos sino **caminos plausibles entre los que
decidir**, que es otra cosa y la explica el apartado del retoque. El tablero
salió de aquí con 13 pasos y cuatro; el retoque lo dejó en 14 y dos.

### La salida mira al este, y eso duplicó los caminos

El usuario pidió girarla —«gira al personaje, que esté mirando hacia la otra
salida»— después de ver el tablero montado con el personaje mirando al norte.

La salida tiene **dos vecinas**, y no son equivalentes: al norte hay una casilla
a la misma altura, así que **andando** sólo se puede ir por ahí; al este hay una
un escalón más arriba, a la que se sube saltando. Con esto, la regla de siembra
—«mira a la vecina a la que llega con un solo avanzar sin chocar»— daba **norte**
sin ambigüedad, y así se había medido: 12 pasos, dos caminos óptimos.

Girarla al este **rompe esa regla a propósito**: el primer «avanzar» del niño
choca. Y salía ganando, medido sobre el tablero de la 0031: 13 pasos y cuatro
caminos óptimos en vez de 12 y dos, porque el giro de arranque se puede pagar en
varios sitios distintos del recorrido y ninguno resulta más barato. El retoque de
abajo cambió después esos números, pero no el motivo del giro.

### El retoque de una altura, con la 0031 ya aplicada

El usuario vio el nivel medido y subió a 4 la casilla de la **fila 3, columna 4**,
que valía 3. Se le ofrecieron dos alternativas de un bloque que dejaban **un
único camino correcto** —12 pasos, 204 recorridos posibles— y las rechazó:

> «ese camino es demasiado fácil, prefiero los dos caminos con 48 recorridos, al
> menos esos 2 caminos no son tan obvios; darle un solo camino así de sencillo es
> como darle una línea recta entre caminos curvados, hace la elección muy obvia».

**Es la lectura fina de su criterio, y corrige la mía dos veces.** Primero medí
«caminos óptimos» pensando que más era mejor, y más caminos óptimos es más
perdonar, no más difícil. Después medí «recorridos posibles» y propuse el máximo,
y un único camino correcto entre muchos posibles tampoco es difícil **si ese
camino es recto y los demás son curvos**: se ve venir. Lo que él quiere es que
los caminos que valen **no se distingan a ojo** de los que no.

| | Pasos | Caminos óptimos | Recorridos posibles | Fallan por 1 paso |
| --- | --- | --- | --- | --- |
| La 0031 | 13 | 4 | 113 | 0 |
| **La 0032** | **14** | **2** | **48** | **2** |
| Las que rechazó | 12 | 1 | 204 / 166 | 2 / 4 |

**La 0031 no se edita**: está aplicada. La reescribe la 0032, igual que la 0024
rehízo el tablero que la 0023 había sembrado.

Lo que el escalón añade al puzle: la casilla que da a la meta mide 3 y la de al
lado pasa a medir 4, así que hay que **subir, bajar andando y volver a saltar**.
Pasar de largo hacia arriba para poder llegar.

### `stepLimit` = `optimalSteps`, como los otros dos

Decisión de siembra del mundo 3, no del formato. Aquí además importa más que en
ningún otro: con sólo dos caminos de 14 y el límite en 14, elegir mal se nota
congelándose, que es el mecanismo con el que este mundo enseña. Dos de los 48
recorridos posibles se quedan **a un solo paso**.

### `optimalSteps`, decidido por la búsqueda del mínimo

**14 sale de `levelSolutions.test.ts`**, que lo lee del `.sql` de la 0032, y **cae
con ±1** —probado con 13 y con 15, y el archivo restaurado con el mismo hash—. El
13 de la 0031 se comprobó igual en su día.

Los otros dos números se midieron aparte y **no los fija ningún test**: los
caminos óptimos, con una cuenta de caminos mínimos sobre el grafo de (casilla,
orientación); los recorridos posibles, enumerando los que no repiten casilla. Son
medidas de diseño y quedan escritas aquí.

### El orden no importa: un solo `update`

`muchos-caminos` no choca con ningún slug del mundo, ni con el `tormenta-final`
que reemplaza. `levels_world_slug_unique` no puede saltar.

### Los textos

- Descripción: «Muchos caminos suben a la cima. Sólo unos pocos te alcanzan.»
  Nombra el eje del mundo sin dar ninguna ruta.
- Narrativa: dice que hay muchos caminos y que casi todos gastan más pasos de los
  que tiene, **avisa de que la casilla de delante está un escalón más arriba**
  —para que el primer choque no se lea como un fallo del juego— y le pide contar
  antes de ejecutar. No describe ningún recorrido.
- El título **cierra el arco del mundo con el nivel 1**: «Dos caminos» → «El
  faro» → «Muchos caminos». Sale del puzle, no al revés.

## Risks / Trade-offs

- **Un `update` que no case actualiza cero filas y no falla** → se mide la fila
  antes del `push` y se relee después, campo a campo contra el `.sql`.
- **La salida contra una casilla más alta puede leerse como un nivel roto** → lo
  avisa la narrativa, y saltar es un bloque que el niño trae aprendido del mundo 2.
- **Los caminos óptimos y los recorridos posibles se midieron con contadores
  escritos para esto**, no con tests permanentes → lo que el test sí fija para
  siempre es el mínimo; los otros dos son medidas de diseño y quedan escritos
  aquí, con la tabla, para que nadie los recalcule de memoria.
- **El nivel 3 estuvo aplicado con el tablero de la 0031 entre un `push` y otro**
  → nadie tiene progreso desde el juego (el J9 no existe), así que no afecta a
  nadie.
