## 1. Reanudar y bloquear el lienzo

- [x] 1.1 `stoppedIndex` en `interpreter.ts`: dónde se planta un recorrido detenido, saltando el aterrizaje si el paso en curso es un despegue. Verificación: tests de parar andando, en el despegue y en el último paso.
- [x] 1.2 `GameScene.tsx`: «Ejecutar» con un recorrido detenido lo reanuda sin releer el lienzo; `onHaltedChange` avisa hacia arriba; el mensaje de detenido dice cómo seguir. Verificación: en pantalla, un programa detenido a mitad sigue desde su casilla y el contador desde su número. **Medido** en el 3 del mundo 2: detenido en 6 pasos, quieto 1,5 s en 6, reanudado sigue en 8 medio segundo después y termina en 23.
- [x] 1.3 La pantalla de nivel y el laboratorio bloquean el lienzo y la caja mientras está detenido, con un texto que dice por qué. Verificación: con el recorrido detenido no se arrastra ningún bloque; tras «Reiniciar» o reanudar, sí. **Medido:** dos capas puestas detenido, ninguna al terminar. «Reiniciar» lo probó el usuario.

## 2. Encuadre

- [x] 2.1 `framing.ts`, puro: distancia y subida a partir del tablero con alturas y del hueco libre. Verificación: tests con el 5 × 1 del mundo 1, un 5 × 5 plano, un zigzag con huecos y la torre de altura 6. **El estirado a lo ancho se implementó y el usuario lo retiró al verlo**; se quitó entero. **Medido:** 15 tests en verde.
- [x] 2.2 `GameScene.tsx` aplica el encuadre sin deformar. Verificación: la meta del nivel 3 del mundo 2 a la vista, con el tamaño ajustado sobre capturas del usuario; el 2 y el 3 del mundo 1 alejados a 15,5. **Medido** con los seis niveles a 1440 px —ver `design.md`—.
- [x] 2.3 La lista de niveles a tres columnas. Verificación: **medido** a 1440 px, tres tarjetas de 348 px en una rejilla de 1085.

## 3. La ventana de felicitaciones

- [x] 3.1 `onFinish` en la escena, una vez por recorrido terminado que llega a la meta. Verificación: no sale al detener. **Medido:** detenido no salió; al terminar el 3 del mundo 2, sí.
- [x] 3.2 `LevelCompleteDialog.tsx` con los nombres del tema, los dos números y los dos botones; «Siguiente nivel» sólo si hay nivel siguiente en el mundo. Verificación: `nextLevel.test.ts`, 4 tests; en el 3 del mundo 2, «¡Nivel perfecto!», 23 y 23, y sólo «Salir al mundo». «Siguiente nivel» lo probó el usuario en pantalla.
- [x] 3.3 «Volver a intentar», pedido por el usuario antes del commit: cierra la ventana, devuelve al personaje a la salida con el contador a cero y deja los bloques. Verificación: en pantalla, tras llegar a la meta y pulsarlo. **Medido** en el 1 del mundo 2: la ventana ofrece «Salir al mundo», «Volver a intentar» y «Siguiente nivel»; al pulsar el segundo se cierra, el personaje vuelve a la salida, «Pasos: 0», y los 12 bloques siguen en el lienzo. Lint, 259 tests y build en 6,72 s, en verde.
- [x] 3.4 La experiencia del nivel en la ventana, pedida por el usuario como recordatorio: la `xp_reward` de la fila, sin concederla. Verificación: en pantalla, la ventana dice «+100 XP» y la barra de experiencia del niño no cambia. **Medido** en el 1 del mundo 2: la ventana dice «+100 XP» y la barra sigue en «100 / 1000 XP», lo que marcaba en todas las pasadas anteriores de la sesión; la lectura de antes de ejecutar se perdió en esta pasada porque el script se pasó de tiempo. Lint, 259 tests y build en 16,29 s, en verde.

## 4. Documentación y cierre

- [x] 4.1 `docs/CONTEXT.md` §2.9: el cambio en la lista de aplicados, las filas de la escena, el cargador, el intérprete, la pantalla de nivel, el laboratorio y `Dashboard.tsx`, y filas nuevas para `framing.ts`, su test, `LevelCompleteDialog.tsx`, `HaltedLock.tsx` y `nextLevel.ts`. `docs/ROADMAP-JUEGO.md` y `openspec/config.yaml` no cambian: no se mueve ni el stack, ni la estructura, ni las prioridades. Verificación: `npx openspec validate` da el cambio por válido.
- [x] 4.2 `npm run lint`, `npm run test:run` y `npm run build`, con la salida cruda. **Medido:** lint sin avisos, 259 tests en 23 archivos, build en 7,44 s.
- [x] 4.3 Commit enumerando las rutas, con autorización del usuario, y archivar el cambio. **Autorizado el 14-sep-2026**, en un solo commit con el cambio archivado dentro.
