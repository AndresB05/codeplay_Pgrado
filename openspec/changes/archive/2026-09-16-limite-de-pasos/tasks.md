## 1. El campo y su lectura

- [x] 1.1 Añadir `stepLimit?: number` a `LevelConfig` en `apps/web/src/game/level.ts`, documentado como el máximo de pasos que el nivel concede y opcional. Verificación: `npm run build -w @codeplay/web` compila sin errores nuevos.
- [x] 1.2 Leer el campo en `readLevelConfig` (`apps/web/src/game/levelConfig.ts`): ausente pasa y no aparece en el resultado; presente tiene que ser entero mayor que cero y no menor que `optimalSteps`; cualquier otra cosa rechaza el nivel entero. Verificación: los casos nuevos de `levelConfig.test.ts` de 1.3.
- [x] 1.3 Cubrir esos tres casos en `apps/web/src/game/levelConfig.test.ts` sobre el tablero `pair`: acepta sin campo, acepta con un máximo válido, y rechaza con cero, con negativo, con no entero, con texto y con un máximo por debajo de `optimalSteps`. Verificación: `npm run test:run -w @codeplay/web` en verde y los seis niveles sembrados siguen aceptándose igual.

## 2. El corte del recorrido

- [x] 2.1 Cortar el recorrido en `runProgram` (`apps/web/src/game/interpreter.ts`) al agotar `config.stepLimit`: las órdenes que queden no se ejecutan, y un salto que no quepa en los pasos restantes no se ejecuta en vez de partirse. Verificación: los casos nuevos de `interpreter.test.ts` de 2.3.
- [x] 2.2 Añadir a `Run` la marca de recorrido cortado por el límite, distinta de comparar la longitud con el máximo —un programa que cuesta justo el máximo no se quedó sin pasos—. Verificación: un caso de 2.3 que ejecuta un programa de coste exactamente el máximo y comprueba que la marca es falsa.
- [x] 2.3 Cubrir el corte en `apps/web/src/game/interpreter.test.ts`: programa que se pasa, programa que cabe justo, salto que no cabe con un paso de sobra, meta pisada con el último paso concedido, meta pisada antes del corte con órdenes de sobra detrás, y un nivel sin `stepLimit` que no se corta nunca. Verificación: `npm run test:run -w @codeplay/web` en verde.

## 3. Lo que ve el niño

- [x] 3.1 Enseñar el contador en cuenta atrás en `apps/web/src/game/GameScene.tsx` cuando el nivel trae máximo: «Pasos restantes: N», con el máximo entero en reposo y bajando con el personaje; sin máximo, el «Pasos: N» de hoy sin tocar. Verificación: en el laboratorio, con un nivel de pega con máximo, el número baja al ejecutar y vuelve al máximo al reiniciar.
- [x] 3.2 Dar texto propio al recorrido cortado por el límite, que diga que se quedó sin pasos y le pida reiniciar, en vez del «No llegaste a la meta» general. Verificación: en el laboratorio, un programa más largo que el máximo deja al personaje plantado y muestra ese texto.
- [x] 3.3 Comprobar que cortar por el límite NO deja el recorrido en el estado congelado de «Detener»: el lienzo no se bloquea y pulsar «Ejecutar» arranca un intento nuevo desde la salida, sin regalar pasos. Verificación: en el laboratorio, tras quedarse sin pasos, los bloques se pueden mover y ejecutar vuelve a empezar.

## 4. Cierre

- [x] 4.1 Escribir el campo en `docs/CONTRATO-DE-INTEGRACION.md` §4.2 —tabla y párrafo propio, con la relación con `optimalSteps` y con el rechazo— y la regla del corte y del salto atómico en §4.4. Verificación: el ejemplo de `config` de §4.2 sigue siendo un nivel válido y el documento se sostiene solo, sin remitir a ningún otro.
- [x] 4.2 Propagar a `docs/CONTEXT.md`, `docs/ROADMAP-JUEGO.md` —la mecánica del mundo 3, y que el J12.5-.7 la da por hecha— y `openspec/config.yaml`. Verificación: `npx openspec doctor` sin errores.
- [x] 4.3 Ejecutar `npm run lint`, `npm run test:run` y `npm run build` desde la raíz y enseñar la salida cruda. Verificación: los tres pasan, lint con cero avisos.
- [x] 4.4 Revertir el apaño del laboratorio antes del commit. **Enseñárselo ahí se cayó el 16-sep-2026 por decisión del usuario** —«yo para qué lo quiero en el laboratorio? quiero los niveles donde van en el mundo 3»—: el laboratorio es el banco de pruebas de quien implementa, no una pantalla que él tenga que abrir. Lo ve jugando el mundo 3 cuando se siembre. Verificación: `git status` no deja rastro del nivel de pega.
