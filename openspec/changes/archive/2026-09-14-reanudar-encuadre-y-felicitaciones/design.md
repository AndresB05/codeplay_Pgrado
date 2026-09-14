## Context

Ver `proposal.md` — Why. Las cuatro peticiones son del usuario, y las tres dudas
que abrían las resolvió él el 14-sep-2026:

- **Lienzo detenido:** se bloquea. Para cambiar el programa, «Reiniciar».
- **Escalar horizontalmente:** eligió estirar los cubos, y **lo retiró al verlo
  en pantalla**: «esta demasiado aplastado y no me gusta, me gustaban mas los
  cubos, solo tenias que alejarlo o ponerlo mas abajo». Se queda sólo el
  encuadre, sin deformar.
- **Cuándo sale la ventana:** siempre que se llegue a la meta.
- **Siguiente nivel en el último de un mundo:** no aparece.

## Goals / Non-Goals

**Goals:** reanudar lo detenido; ver entero cualquier tablero con alturas; llenar
el hueco del juego; felicitar al llegar y llevar al siguiente nivel.

**Non-Goals:** guardar el intento (J9); la XP (J10); ilustraciones (J13).

## Decisions

### Reanudar es seguir con el mismo intento

Hoy `start()` pone el índice a cero y vuelve a leer el lienzo. Con un recorrido
detenido, «Ejecutar» pasa a **quitar la marca de congelado y nada más**: el
intento, su recorrido y el índice se quedan, así que el personaje sigue desde su
pose y el contador desde sus pasos. Sin recorrido detenido, `start()` es el de
siempre.

Vuelve a leer el lienzo sólo lo de siempre; lo detenido no lo relee, y **el
bloqueo del lienzo es lo que garantiza que no haga falta**: lo que se reanuda es
lo que está a la vista.

### Detener aterriza, y aterriza entero

Detener adelanta el índice uno para que el personaje se plante en la casilla del
paso en curso. Con los saltos eso falla: un salto son **dos entradas** del
recorrido —despegue y aterrizaje—, y parar en el despegue deja el índice apuntando
al aterrizaje. Al reanudar, la animación del aterrizaje empieza a mitad de arco y
el personaje aparecería a media altura entre dos casillas.

Así que la parada **salta también el aterrizaje** cuando el paso en curso es un
despegue. Vive en `interpreter.ts` como función pura, `stoppedIndex`, junto a
`stepsTaken`, por lo mismo que aquélla: dentro del componente no se puede probar.

### El lienzo se bloquea desde la composición

Quien sabe que el recorrido está detenido es la escena; quien posee el lienzo y la
caja es la pantalla. La escena avisa hacia arriba con **`onHaltedChange`**, un
booleano: no sube el intento ni el intérprete, así que la frontera diferida sigue
igual.

La pantalla pone encima del lienzo y de la caja **una capa que se come el
puntero**, con un texto que dice por qué. No se toca Blockly: su modo de sólo
lectura se decide al inyectar, y reinyectar tira los bloques.

### El encuadre, calculado y no medido a mano

`CAMERA_START` y `BOARD_LIFT` salieron de medir un 5 × 5 **plano**, y
`boardScale` sólo mira el lado mayor. Una torre de altura 6 no cabe.

Nace `framing.ts`, **puro**, que recibe el tablero y el tamaño del hueco libre
—el juego menos la bandeja— y devuelve la distancia de la cámara y cuánto subir
el tablero. Proyecta las esquinas de la caja que ocupa el tablero —de `y = −1` a
lo alto de la columna más alta, con el personaje encima— con la cámara de
partida, y busca por bisección la distancia más corta a la que cabe en el alto
libre y en el ancho, y la subida que lo centra en esa franja. Se puede probar sin
WebGL: la proyección es aritmética de `three`, no dibujo.

La cámara nunca se busca **dentro** de la esfera que envuelve el tablero: ahí la
proyección se da la vuelta y un tablero que no cabe parece caber. Fue el primer
fallo que dieron los tests.

### El tamaño lo fijó el usuario con capturas

Los márgenes salen de dos capturas suyas del 14-sep-2026: lo más alto del
tablero **casi a la altura de los botones** —56 px— y la base casi en la bandeja
—8 px—. El tamaño se mide con las caras de arriba de las columnas; el personaje
de pie sobre la meta queda dentro del juego, y en lo alto de un salto sobre la
torre roza el borde un instante, aceptado para no encoger el tablero.

### Un tablero plano con huecos no se acerca más que uno lleno

Midiendo sólo las columnas que existen, el 2 y el 3 del mundo 1 —caminos llanos
que ocupan poco de su 5 × 5— quedaban a 9,04 y 10,79, pegados a la cámara; antes
del cambio estaban a 15,01. El usuario pidió alejar **esos dos**. La regla: un
tablero **plano** con huecos no se acerca más que el mismo rectángulo lleno, que
sale a 15,5. Con alturas no se aplica: los del mundo 2 también tienen huecos y su
tamaño lo dio él por bueno. Medido después: 11,41 · 15,5 · 15,5 en el mundo 1 y
11,42 · 13,47 · 17,01 en el mundo 2.

### El punto 3 era la lista de niveles

«Los niveles dejan mucho espacio hueco» hablaba de **la lista de niveles**, no
del tablero: la rejilla de tarjetas llegaba hasta cinco columnas y con tres
niveles por mundo sobraba medio ancho. Se preguntó mal —«estirar los cubos o
acercar la cámara»— y el usuario lo aclaró con una captura. La rejilla pasa a
**tres columnas** en `StudentWorldLevelsModule.tsx`: medido a 1440 px, tres
tarjetas de 348 px llenan los 1085 de la rejilla.

### Estirar la imagen se probó y se retiró

La primera versión ensanchaba la imagen —diciéndole a la cámara que el lienzo era
más estrecho de lo que era— para llenar el hueco de los lados, con un tope de
1,6. **El usuario lo vio en pantalla y lo retiró**: aplastado y amontonado. Queda
escrito para que no se vuelva a proponer: el hueco de los lados se acepta, y lo
que se aprovecha es acercar la cámara hasta donde quepa.

### La ventana vive en la pantalla, y la escena sólo avisa

La escena avisa con **`onFinish`** cuando termina un recorrido que llega a la
meta, con los pasos usados y los de la mejor solución. Avisa **una vez por
recorrido terminado**: al cerrarse la ventana no vuelve a salir hasta que haya
otra llegada.

La pantalla la pinta con `LevelCompleteDialog`, en `components/dashboard/student/`,
con los nombres del tema —`ConfirmDialog` lleva hexadecimales y no se copia eso—.
**Sin mascota**: su hueco se deja vacío hasta las ilustraciones definitivas.

- **«Salir al mundo»** lleva a la lista de niveles del mundo.
- **«Siguiente nivel»** lleva al nivel de **orden siguiente del mismo mundo**, que
  se busca con `getLevelsByWorld`. Si no hay, no se pinta.

- **«Volver a intentar»**, pedido por el usuario antes del commit, **vuelve a
  montar la escena** con una clave: el intento vive dentro de ella y no sube, así
  que montarla otra vez es lo que la devuelve a la salida. El editor no cuelga de
  esa clave y **los bloques se quedan** —elegido por la sesión: se vuelve a
  intentar para mejorar el programa, no para rehacerlo—.

Al abrir el nivel siguiente la pantalla **se monta de cero** —por el `levelId`—,
o el lienzo y el intento del nivel anterior se quedarían puestos.

**El laboratorio no la abre**: no tiene mundo al que salir.

## Risks / Trade-offs

- **Sobra ancho a los lados en tableros altos o estrechos** → aceptado por el
  usuario frente a deformar.
- **Una capa sobre el lienzo puede dejarlo bloqueado si la marca no se limpia** →
  la marca sale del mismo estado que habilita «Detener», y «Reiniciar» la quita
  siempre.
- **La ventana tapa el tablero** → se cierra con los botones o con Escape; el
  resultado sigue escrito en la franja del lienzo.
