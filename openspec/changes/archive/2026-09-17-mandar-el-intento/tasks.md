## 1. Medir el síntoma antes de tocar nada

- [x] 1.1 Jugar y superar un nivel con una cuenta real, y consultar `user_progress`, `level_attempts` y `profiles.total_xp` antes y después. Verificación: las tres quedaron idénticas —una fila de progreso y dos intentos, todos del 3-sep-2026—, y el nivel superado no dejó ninguna.
- [x] 1.2 Comprobar en el código que nadie llama a las dos RPC. Verificación: `createAttempt` y `upsertProgress` no aparecen fuera de su propio archivo.

## 2. Lo que sube de la escena

- [x] 2.1 Ampliar `LevelFinish` en `apps/web/src/game/GameScene.tsx` con el resultado, si se agotó el máximo, si sobraron bloques, el programa ejecutado en su sobre y la duración. Verificación: `npm run build -w @codeplay/web` compila.
- [x] 2.2 Congelar el programa ejecutado dentro del intento, sellado con `sealProgram` al pulsar «Ejecutar»: mover un bloque después no puede cambiar lo que se manda. Verificación: el `submitted_code` guardado contiene el programa que se ejecutó y su `formatVersion`.
- [x] 2.3 Avisar también de los recorridos que no llegan a la meta, sin tocar la referencia que garantiza un aviso por recorrido. Verificación: un recorrido fallido produce un intento guardado y **ninguna** ventana.

## 3. La traducción del anfitrión

- [x] 3.1 Escribir `apps/web/src/components/dashboard/student/submitAttempt.ts`: de una partida terminada a `create_level_attempt` y `upsert_my_progress`, con el estado `completed` al superar e `in_progress` al fallar. Verificación: los casos de 3.2.
- [x] 3.2 Cubrir la decisión en `submitAttempt.test.ts`: superado, fallado, sin pasos, la meta pisada antes de agotar el máximo, el sobre entero y las observaciones. Verificación: `npm run test:run -w @codeplay/web` en verde.
- [x] 3.3 Ampliar `createAttempt` a los seis parámetros de la RPC, estrenando `input_runtime_ms` e `input_metadata`. Verificación: la fila guardada trae duración y observaciones, que hasta hoy llegaban vacías.
- [x] 3.4 Mandar el intento desde el manejador de `StudentLevelModule`, nunca desde un efecto, y abrir la ventana sólo al llegar a la meta. Verificación: con `React.StrictMode` puesto, una partida deja **una** fila.
- [x] 3.5 Avisar en la ventana cuando el guardado falle, sin esperar por él. Verificación: el aviso no aparece en un guardado que sí funciona.

## 4. La deuda §4.12

- [x] 4.1 Filtrar por `completion_status` el contador de `StudentWorldsModule.tsx`. Verificación: un mundo con una fila `in_progress` y ningún nivel superado dice 0/3, y el contador viejo sobre esos mismos datos diría 1/3.

## 5. Cierre

- [x] 5.1 Verificar contra la base real los ocho casos: superar, quedarse sin pasos, fallar un nivel ya superado, superar después el que se había fallado, lienzo vacío, recorrido detenido, recorrido reanudado y el contador de mundos. Verificación: la tabla de §2.7 de `docs/CONTEXT.md`.
- [x] 5.2 Propagar a `docs/CONTEXT.md` —§2.7, §2.9, §3 y §4.12—, a `docs/ROADMAP-JUEGO.md` y a `openspec/config.yaml`. Verificación: `npx openspec doctor` sin errores.
- [x] 5.3 Ejecutar `npm run lint`, `npm run test:run` y `npm run build` desde la raíz. Verificación: los tres pasan, lint con cero avisos.
