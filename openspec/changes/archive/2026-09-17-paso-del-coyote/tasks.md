## 1. La curva

- [x] 1.1 Escribir `apps/web/src/game/fall.ts`: `heightAt(from, to, along)` con el tramo en el aire hasta la mitad del paso y la caída acelerando después, y `subir` y `llano` como recta. Puro, sin `three`. Verificación: los casos de 1.2.
- [x] 1.2 Cubrirlo en `fall.test.ts`: llano, subir, los dos extremos, quedarse arriba hasta cruzar el borde —**con el número que la recta daba antes**—, la aceleración, la velocidad inicial cero, que nunca sube mientras cae, y que una caída larga se reparte igual que una corta. Verificación: `npm run test:run -w @codeplay/web` en verde.

## 2. El cable

- [x] 2.1 Sacar la altura del personaje de `heightAt` en `GameScene.tsx`, dejando lo horizontal como estaba. Verificación: `npm run build -w @codeplay/web` compila.
- [x] 2.2 Comprobar que el salto queda cubierto sin código propio: sus dos mitades comparten `along` y las dos alturas del trayecto, así que el despegue cae en el aire y el aterrizaje en la caída. Verificación: la medición de 3.2.

## 3. Verificación en el navegador

- [x] 3.1 Medir un paso andando que baja **tres niveles** en «La torre», leyendo la posición del personaje de la escena con `_roots`. Verificación: la altura se mantiene hasta media casilla y sólo entonces cae, acelerando, y aterriza justo al llegar.
- [x] 3.2 Medir el mismo descenso **saltando**. Verificación: el cenit queda por encima de la altura de despegue, no por debajo.
- [x] 3.3 Comprobar que andar en llano y saltar hacia arriba no cambiaron. Verificación: en llano la altura no se mueve; el salto que sube tiene el mismo cenit que antes.
- [x] 3.4 Comprobar que **el recuento no se movió**. Verificación: el mismo programa cuesta 20 pasos andando el último y 21 saltándolo, que es lo que cuesta un salto, y los tests del intérprete y de las soluciones siguen en verde.

## 4. La caída, rehecha porque el usuario la vio

- [x] 4.1 Cambiar el reparto fijo del paso por una **gravedad** constante, con `FALL_GRAVITY` y `fallSeconds`, y hacer que el paso se alargue lo que la caída tarde. Pedido al ver la primera versión: «que no se sienta brusco, tipo gravedad lunar». Verificación: bajar tres niveles ya no tarda 170 ms.
- [x] 4.2 Separar los dos relojes en `GameScene.tsx`: lo horizontal, el giro y el arco en `STEP_SECONDS`, la caída en el suyo, y el fin del paso cuando acaban los dos. Verificación: medido, el personaje cruza el borde a los 167 ms en todas las bajadas, caiga uno o tres niveles.
- [x] 4.3 Reescribir `fall.test.ts` contra el modelo de tiempo, con la duración de cada caída y la misma gravedad para todas. Verificación: 13 casos en verde.

## 5. Cierre

- [x] 5.1 Propagar a `docs/CONTEXT.md` §2.9 y §4.13. Verificación: `npx openspec doctor` sin errores.
- [x] 5.2 Ejecutar `npm run lint`, `npm run test:run` y `npm run build` desde la raíz. Verificación: los tres pasan, lint con cero avisos.
