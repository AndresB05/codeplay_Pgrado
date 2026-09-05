## 1. La dependencia

- [x] 1.1 Instalar Blockly con `npm install blockly@^12.5.1 -w @codeplay/web` —la 13 rompe la instalación, ver `design.md` §1—, y verificar que termina sin error y que `apps/web/package.json` lo lista en `dependencies`
- [x] 1.2 Comprobar que **no hace falta paquete de tipos**. Los declara por el mapa de `exports`, no por un campo `types` suelto: `node -e "console.log(require('./node_modules/blockly/package.json').exports['./core'].types)"` responde `./core.d.ts`
- [x] 1.3 Contar los binarios de plataforma de `@supabase/cli` en `package-lock.json` y verificar que siguen siendo **ocho** (`darwin`, `linux` y `windows`). Si faltara alguno, restaurar el lockfile y repetir la instalación
- [x] 1.4 `npm ls jsdom --all` y verificar **cuál resuelve Vitest**: hoy es `jsdom@30.0.1` deduplicado, y Blockly va a meter una segunda copia, la `26.1.0` suya. Vitest tiene que seguir en **30.0.1**; si cayera a la 26, los 121 tests pasarían a correr contra otra implementación del DOM que aquella contra la que se escribieron —y **probablemente seguirían pasando**, que es la forma exacta del desastre de las dos copias de `three` que `CONTEXT.md` §2.9 documenta: no dio error, dio una escena vacía—

## 2. El sobre, puro y sin Blockly

- [x] 2.1 Escribir `apps/web/src/game/program.ts` con el tipo del sobre, la constante `grid-blockly-1` y las funciones que lo cierran y lo abren, sin importar Blockly ni JSX, y verificar que `npx tsc --noEmit -p apps/web` no protesta
- [x] 2.2 Escribir `apps/web/src/game/program.test.ts`: el sobre se cierra con la versión del contrato, y abrir uno con una versión desconocida se rechaza entero (§7 del contrato). Verificar con `npm run test:run`

## 3. Los bloques

- [x] 3.1 Escribir `apps/web/src/game/blocks.ts` con los tres bloques —`avanzar N`, `girar a la izquierda`, `girar a la derecha`—, su texto **en español**, el número como `field_number` acotado a enteros de 1 a 10, y la caja de herramientas. Importar de `blockly/core`, no de `blockly`. Verificar que compila
- [x] 3.2 Escribir `apps/web/src/game/blocks.test.ts` con el viaje de ida y vuelta contra `new Blockly.Workspace()` —sin interfaz—: construir un programa, guardarlo, cargarlo en otro espacio y comprobar que al volver a guardarlo sale lo mismo. Verificar con `npm run test:run`
- [x] 3.3 Comprobar **cuál compilación de Blockly resolvió Vitest**: bajo Vitest se está en un entorno de node, así que `blockly/core` puede resolverse por su condición `node` hasta `core-node.js` —el build que arrastra jsdom—, mientras el navegador recibe el otro. Dejar escrito en el propio test **qué cubre y qué no**, en vez de dar por hecho que las dos compilaciones serializan igual
- [x] 3.4 Si el test de 3.2 no pasara porque Vitest no resuelve Blockly, **parar y avisar** antes de escribir ninguna capa de compatibilidad: si el viaje de ida y vuelta falla de verdad, la decisión del J3 está mal y se vuelve sobre ella

## 4. El editor y su frontera

- [x] 4.1 Escribir `apps/web/src/game/BlockEditor.tsx`: inyecta Blockly en un `div`, carga el español con `setLocale` y los mensajes de `blockly/msg/es`, define los bloques, publica el programa hacia arriba y limpia el espacio de trabajo al desmontarse. Sin papelera, sin controles de zoom y sin sonidos, para no depender de los ficheros de `media/`
- [x] 4.2 Añadir el `ResizeObserver` sobre el contenedor que llama a `svgResize`, y verificar en el navegador que el lienzo se reajusta al plegar la barra lateral, no sólo al cambiar el tamaño de la ventana
- [x] 4.3 Escribir `apps/web/src/game/BlockEditorLoader.tsx` calcado de `GameSceneLoader.tsx` —`lazy()` + `Suspense` con el mismo aviso de carga—, y verificar que **no importa Blockly** ni directa ni indirectamente

## 5. El banco de pruebas

- [x] 5.1 Montar `BlockEditorLoader` en `StudentGameLabModule.tsx` dentro de una tarjeta con **altura fija** —un padre sin altura deja el lienzo en cero, igual que `<Canvas>`—, y enseñar debajo el JSON del sobre que producen los bloques
- [x] 5.2 Reescribir el texto que hoy dice «Todavía no hay bloques —llegan más adelante—»: los bloques ya están, y las órdenes de consola siguen porque el programa no se ejecuta hasta el J5
- [x] 5.3 Verificar en el navegador el criterio de la fila del roadmap: se arrastran bloques, se encadenan y el JSON de pantalla refleja cada cambio.
  **Lo que quedó sin comprobar en el navegador**: cambiar el número desde la interfaz. La causa, medida: **una ventana oculta o minimizada suspende los frames** —`requestAnimationFrame` deja de dispararse— **mientras `document.hidden` sigue diciendo `false`**, así que la página no puede detectarlo; y Blockly 12 encola los redibujados en un frame de animación, con lo que la tubería se atasca y parece un fallo del editor. No lo es: el valor del campo **sí** se actualiza (comprobado contra la API de Blockly en la propia página) y el camino modelo→JSON lo cubre `blocks.test.ts`. Anotado en `CONTEXT.md` §2.9 porque el J5 y el J6 se lo van a encontrar

## 6. Las medidas del bundle

- [x] 6.1 Ejecutar `npm run build` y anotar las cifras. **El principal sube 0,21 kB**: de 624,57 (167,68 gzip) a **624,78** (167,77), con **219 módulos** (eran 209). No es Blockly —la marca sale cero veces, tarea 6.3—: son el cargador nuevo y la tarjeta del laboratorio, que por diseño viven POR ENCIMA de la frontera. Blockly cayó en `BlockEditor-*.js`, **644,50 kB** (172,77), y `GameScene` no se movió ni un byte: 825,21 (222,25)
- [x] 6.2 Contar una marca inequívoca de **jsdom** en el trozo donde cayó Blockly y verificar que sale **cero**: que su dependencia de jsdom no pesa en el navegador está razonado —la condición `node` de su `exports` no la resuelve la compilación de navegador— pero no medido, y el tamaño solo no dice qué librería se coló
- [x] 6.3 Contar una marca inequívoca de Blockly en el trozo principal con `grep -o … | wc -l` —nunca con `grep -c`, que cuenta líneas y en un archivo minificado da 1— y verificar que sale **cero**, como el J1 hizo con `WebGLRenderer`

## 7. El contrato y la documentación

- [x] 7.1 `docs/CONTRATO-DE-INTEGRACION.md` §4.3: pegar el interior del sobre **copiado de una salida real** del editor, con los tres bloques encadenados
- [x] 7.2 En el mismo §4.3, escribir **qué parte de la forma queda sin registrar** —el ejemplo es plano y no enseña anidamiento; `repetir N veces [cuerpo]` de §4.4 no existe todavía— y en qué paso se registra
- [x] 7.3 Repasar §8 del contrato: pierde su viñeta de «el interior del sobre», que ya no está sin fijar
- [x] 7.4 `docs/ROADMAP-JUEGO.md` §3: el J4 pasa a ✅, y la nota «el interior del sobre lo registra el J4» pasa a hecho
- [x] 7.5 `docs/CONTEXT.md` §2.9: las rutas reales de los archivos nuevos, la frontera del bundle —que deja de ser una— y la versión de Blockly con el porqué
- [x] 7.6 `docs/CONTEXT.md` §4.8: las medidas nuevas del punto 6
- [x] 7.7 `docs/ESTADO-DEL-PROYECTO.md`: corregir **la fila «Librerías del juego»**, que dice que React Three Fiber y Blockly están «pendientes de confirmar». El resto del desfase de ese documento no es de este cambio
- [x] 7.8 `openspec/config.yaml`, bloque STACK: añadir Blockly y que la frontera diferida deja de ser una sola. Verificar con `npx openspec doctor` que el YAML sigue parseando

## 8. Verificación final

- [x] 8.1 `npm run lint` con 0 warnings, `npm run test:run` con **134 tests en 18 archivos** —los 121 de antes más 13 nuevos— y `npm run build` sin error. Los tres pasan.
  **Hallazgo aparte, y NO es del J4**: el suite falla de forma intermitente bajo carga (`ResetPassword`, `ChangeNamePanel`, `Signup`, `TeacherPanelModule`, `ClassroomsProvider`). Medido excluyendo los dos archivos de test nuevos: los 121 originales fallan igual, 5 y 3 veces en dos de tres pasadas. Es preexistente y puede poner el CI en rojo sin motivo
- [x] 8.2 Enumerar las rutas en `git add`, nunca `git add -A`: con varios cambios vivos el árbol casi nunca contiene sólo lo que se está commiteando
