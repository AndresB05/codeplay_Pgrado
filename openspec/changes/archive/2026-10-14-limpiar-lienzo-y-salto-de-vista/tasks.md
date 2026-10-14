## 1. El salto de la vista (`apps/web/src/game/BlockEditor.tsx`)

- [x] 1.1 Antes de tocar nada, correr en la pantalla de nivel el guion de la medición (tres montones de tres, vista en el del medio, arrastrarlo a la bandeja) y anotar `viewTop` antes y después; debe repetir el salto (~16 900).
- [x] 1.2 Sobrescribir `scrollBoundsIntoView` en la instancia del lienzo para que no haga nada con un bloque soltado fuera del lienzo o en vuelo (D1); verificar con el guion que `viewTop` se queda en 350 y los dos montones restantes en su sitio de pantalla.
- [x] 1.3 Quitar `transition` y `transform` del SVG del bloque justo antes del `dispose` en `flyBackToBox` (D1b); verificar que el guion sigue dando 350.
- [x] 1.4 Repetir el guion con un bloque suelto y con dos montones sacados seguidos antes de que acabe el primer vuelo; verificar que la vista no se mueve y que la clase `arrastrando-bloque` desaparece al final.

## 2. «Limpiar» (`BlockEditor.tsx`, `GameScene.tsx`, loaders)

- [x] 2.1 `BlockEditor` y `BlockEditorLoader`: propiedad `clearSignal: number`; al cambiar —no al montar— `workspace.clear()`. Verificar en navegador que el programa publicado queda vacío y aparece el texto de lienzo vacío.
- [x] 2.2 `GameScene` y `GameSceneLoader`: «Reiniciar» pasa a «Limpiar», con `ConfirmDialog` por portal a `document.body` y textos de D4; al confirmar, `reset()` y `onClear()`. Desactivado con el programa vacío y con `isRunning`. Verificar: cancelar (botón, Escape, fuera) no cambia nada; confirmar vacía lienzo y devuelve al personaje.
- [x] 2.3 `StudentLevelModule` y `StudentGameLabModule`: contador `clearSignal` subido por `onClear` y pasado al editor. Verificar las dos pantallas.
- [ ] 2.4 Verificar que limpiar un nivel con bloques de partida deja el lienzo vacío y no los repone. **Sin verificar en navegador: ningún nivel sembrado trae bloques de partida.** Por código, `clear()` no los relee: sólo se cargan al montar.

## 3. Salida del recorrido detenido (D3)

- [x] 3.1 `GameScene`: propiedad `restartSignal: number` que llama a `reset()` al cambiar, no al montar.
- [x] 3.2 `HaltedLock`: botón «Cambiar los bloques» opcional y texto nuevo; las dos composiciones lo ponen sólo en el bloqueo del lienzo y suben `restartSignal`. Verificar: detener, pulsar el botón, el personaje vuelve a la salida, el lienzo conserva los bloques y se pueden mover.
- [x] 3.3 Verificar que «Limpiar» con el recorrido detenido vacía el lienzo y levanta el bloqueo.

## 4. Textos (`GameScene.tsx`)

- [x] 4.1 `OUTCOME_MESSAGES.stopped` y `OUT_OF_STEPS_MESSAGE` según D4; verificar con `grep -rn "Reiniciar" apps/web/src` que no queda ninguna mención visible al niño.

## 5. Cierre

- [x] 5.1 Actualizar `docs/CONTEXT.md` §2.9 con el arreglo, la causa medida y «Limpiar», con rutas reales.
- [x] 5.2 `npm run lint`, `npm run test:run` y `npm run build` pasan; `npx openspec validate limpiar-lienzo-y-salto-de-vista --strict` pasa.
