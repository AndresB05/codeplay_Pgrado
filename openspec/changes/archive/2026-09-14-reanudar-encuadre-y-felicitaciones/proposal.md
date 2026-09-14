## Why

El usuario jugó los nueve niveles sembrados hasta hoy y pidió cuatro cosas el
14-sep-2026, con la pantalla de nivel delante:

1. **«Detener» funciona a medias.** Congela al personaje, pero «Ejecutar» vuelve a
   empezar desde la salida: hace de reiniciar. Lo que quiere es que **reanude**
   desde donde se detuvo, dando sólo los pasos que faltan.
2. **El nivel 3 del mundo 2 no se ve entero.** Su torre llega a altura 6 y la meta
   se sale por arriba del encuadre de partida: hay que girar la cámara para verla.
3. **La lista de niveles deja mucho hueco.** Las tres tarjetas de un mundo ocupan
   la mitad izquierda y sobra el resto del ancho. *(Se entendió primero como el
   tablero del juego; el usuario lo aclaró con una captura.)*
4. **Al terminar un nivel falta una felicitación**: una ventana con dos botones,
   salir al mundo y siguiente nivel.

## What Changes

- **Reanudar.** «Ejecutar» con un recorrido detenido **sigue desde el paso en el
  que se quedó**, sin volver a la salida y sin volver a leer el lienzo. El
  contador sigue contando desde donde estaba. «Reiniciar» sigue siendo la única
  forma de empezar de cero.
- **El lienzo se bloquea mientras el recorrido está detenido**, decidido por el
  usuario: ni se mueven bloques ni se sacan de la caja. Así lo que se reanuda es
  siempre lo que se ve. Para cambiar el programa hay que pulsar «Reiniciar».
- **Detener no deja al personaje a medio salto**: si lo pilla despegando, aterriza.
- **El encuadre de partida cuenta las alturas** y encaja el tablero entero —de la
  base de sus columnas a lo alto de la más alta— en la franja libre sobre la
  bandeja del lienzo.
- **El tablero aprovecha el hueco sin deformarse**: la cámara se acerca o se aleja
  y el tablero sube o baja hasta ocupar lo que cabe. **Primero se probó estirar la
  imagen a lo ancho**, que fue lo que el usuario eligió al preguntarle, y **lo
  retiró al verlo** el mismo 14-sep-2026: «se ve feo y amontonado». Los cubos se
  quedan cubos.
- **Un tablero plano con huecos no se acerca más que uno lleno de su tamaño**, para
  que el 2 y el 3 del mundo 1 no queden pegados a la cámara.
- **La lista de niveles pone sus tres tarjetas a todo el ancho.**
- **Nace la ventana de felicitaciones**, que sale **siempre que se llega a la
  meta**: dice los pasos usados y los de la mejor solución, felicita el recorrido
  perfecto y anima a mejorar si sobraron. Lleva **«Salir al mundo»**, **«Volver a
  intentar»** —pedido por el usuario antes del commit— y **«Siguiente nivel»**,
  que no aparece en el último nivel de un mundo. Enseña también **la experiencia
  del nivel**, como recordatorio y **sin concederla**, pedido por el usuario.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `juego-3d`: detener se puede reanudar y bloquea el lienzo; el contador sigue al
  reanudar; el encuadre cuenta las alturas y aprovecha el hueco sin deformar; y
  llegar a la meta abre la ventana de felicitaciones.

## Impact

**Base de datos.** Ninguna migración.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/game/interpreter.ts` | Dónde se planta un recorrido detenido, sin partir un salto |
| `apps/web/src/game/framing.ts` | **Nuevo, puro.** El encuadre: distancia de la cámara y subida del tablero a partir del tablero y del hueco libre |
| `apps/web/src/game/GameScene.tsx` | Reanudar, avisar hacia arriba de la parada y de la llegada, y aplicar el encuadre |
| `apps/web/src/game/GameSceneLoader.tsx` | Deja pasar los dos avisos nuevos |
| `apps/web/src/components/dashboard/student/StudentLevelModule.tsx` | Bloquea el lienzo, busca el nivel siguiente y abre la ventana |
| `apps/web/src/components/dashboard/student/LevelCompleteDialog.tsx` | **Nuevo.** La ventana de felicitaciones |
| `apps/web/src/components/dashboard/student/StudentGameLabModule.tsx` | Bloquea el lienzo igual; sin ventana, porque no hay mundo |
| `apps/web/src/components/dashboard/student/HaltedLock.tsx` | **Nuevo.** La capa del lienzo detenido, compartida por las dos composiciones |
| `apps/web/src/components/dashboard/student/nextLevel.ts` | **Nuevo, puro.** El nivel siguiente dentro del mundo |
| `apps/web/src/components/dashboard/student/StudentWorldLevelsModule.tsx` | La rejilla de tarjetas, a tres columnas |
| `apps/web/src/pages/Dashboard/Dashboard.tsx` | La pantalla de nivel se monta de cero al cambiar de nivel |
| `apps/web/src/game/*.test.ts` | La parada sin partir saltos, el encuadre y el nivel siguiente |

**Documentación.** `docs/CONTEXT.md` §2.9, `docs/ROADMAP-JUEGO.md` y
`openspec/config.yaml` si cambia algo de lo que resumen.

**Lo que NO entra:** guardar el intento ni dar XP (J9 y J10) —la ventana enseña
la XP de la fila, pero no la concede—; la ilustración de la mascota en la ventana, que espera a las
definitivas; y el aspecto del juego (J13).
