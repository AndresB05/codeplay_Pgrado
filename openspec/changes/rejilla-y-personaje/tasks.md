## 1. Línea de partida

Se mide **antes** de tocar nada, porque después ya no se puede.

- [x] 1.1 Guardar la salida de `npm run build`: trozo principal, gzip, trozo del juego y número de módulos. Verificación: coincide con lo escrito en `proposal.md` —624,57 kB / 167,68 gzip para el principal, 823,50 kB / 221,63 para el de `GameScene`, 206 módulos—; si no coincide, **parar y decirlo**, porque la comparación final se hace contra esta cifra y no contra la del documento.
- [x] 1.2 Guardar los nombres de los `it(` de los 15 archivos de test, no sólo el total (`ROADMAP.md` §1.3 punto 7). Verificación: la lista tiene 109 entradas y queda en un archivo para comparar al final. **El patrón va anclado al principio de línea** —`^\s*it\(`—: un `it(` suelto da **112**, porque `server.emit()` aparece tres veces en `ClassroomsProvider.test.tsx` y contiene `it(` como subcadena; contando así se cree uno que perdió tres tests. **Y se lanza con `npm run test:run`**: `npx vitest run` desde la raíz se salta la configuración del workspace y da decenas de fallos falsos.

## 2. Los tipos del tablero — `apps/web/src/game/level.ts`

- [x] 2.1 Declarar `TileKind`, `Direction`, `Cell`, `Pose` y `LevelConfig` con la forma de `design.md` decisión 1, y la constante `TILE_SIZE = 1`. Verificación: el archivo **no importa nada** —ni `three`, ni `react`, ni ningún otro módulo del repositorio— y `npx tsc --noEmit` desde `apps/web` pasa.
- [x] 2.2 Dejar escrito en el comentario de cabecera que **el formato es provisional y lo fija el J3**, y que `TILE_SIZE` es 1,0 por decisión y **no se deduce de ningún modelo** (`ROADMAP-JUEGO.md` §3). Verificación: el comentario explica *por qué*, no *qué*, como manda `CLAUDE.md`.
- [x] 2.3 **No** declarar un campo `walkable`: transitable se deriva de `kind === 'floor'` (design, decisión 1). Verificación: la palabra no aparece como campo de `LevelConfig`.

## 3. La rejilla de pega — `apps/web/src/game/debugLevel.ts`

- [x] 3.1 Escribir la configuración a mano: 5×5, salida en una esquina y meta en otra, **con al menos un muro y al menos un hueco**. Verificación: la matriz se lee como un tablero en el propio código fuente, y contiene al menos un `'wall'` y al menos un `'gap'`.
- [x] 3.2 Comprobar que la meta es **alcanzable** desde la salida esquivando el muro y el hueco. Verificación: se traza a mano un camino sobre la matriz escrita; si no lo hay, el tablero no sirve para ver nada moverse.
- [x] 3.3 Dejar escrito que **no es un puzle diseñado** y que el diseño de los nueve puzles es del usuario, en el J6 y el J7.1 (`ROADMAP-JUEGO.md` §3). Verificación: quien abra el archivo no puede confundirlo con contenido del producto.

## 4. Las reglas puras — `apps/web/src/game/movement.ts`

**Es lo que el J5 reutiliza**, y por eso va antes que la escena.

- [x] 4.1 Implementar `turn(facing, side)` con las cuatro direcciones (design, decisión 2). Verificación: el archivo **no importa `three`, ni `@react-three/fiber`, ni `react`**, y no contiene JSX.
- [x] 4.2 Implementar `advance(config, pose)` devolviendo `{ pose, blockedBy }`, con `blockedBy` en `'wall' | 'gap' | 'edge' | null` (design, decisión 2). Verificación: no muta la pose que recibe —el objeto de entrada sigue igual después de llamarla— y nunca lanza.
- [x] 4.3 Tratar el borde como caso propio: una fila o columna fuera de la matriz da `'edge'`, no un acceso a `undefined`. Verificación: el test del borde pasa por los cuatro lados sin excepción en consola.

## 5. Los primeros tests del juego — `apps/web/src/game/movement.test.ts`

- [x] 5.1 Escribir el test **al lado del archivo que prueba**, siguiendo el idiom de `context/invitationToken.helpers.ts` y su test. Verificación: `npm run test:run` lo recoge y el archivo nuevo aparece en el recuento.
- [x] 5.2 Cubrir avanzar: a casilla pisable, contra muro, contra hueco y contra los cuatro bordes (spec, «El personaje se mueve por casillas y no atraviesa nada»). Verificación: los siete casos son `it(` distintos y todos pasan.
- [x] 5.3 Cubrir girar: a un lado, al otro, y cuatro giros seguidos que vuelven a la dirección de partida (spec, mismos escenarios). Verificación: pasan, y el de los cuatro giros comprueba además que la casilla no cambió.
- [x] 5.4 Cubrir que **un avance bloqueado no cambia la orientación**, que es lo que distingue «no avanzó» de «se quedó mirando a otro lado». Verificación: hay un `it(` que lo dice y pasa.
- [x] 5.5 Usar configuraciones **escritas dentro del test**, no la de `debugLevel.ts` (design, decisión 7). Verificación: el test no importa `debugLevel`.

## 6. El tablero en la escena — `apps/web/src/game/GameScene.tsx`

- [x] 6.1 Pintar el tablero recorriendo `config.tiles`, con la traducción de `row`/`column` a coordenadas del mundo **en un solo sitio** y `TILE_SIZE` en todos los tamaños (design, decisión 5). Verificación: no hay ningún número de tamaño de casilla escrito suelto en el archivo, y las losas quedan contiguas sin rendijas al mirarlas.
- [x] 6.2 Distinguir a la vista losa pisable, muro, hueco, salida y meta (spec, «El tablero se dibuja a partir de la configuración del nivel»). Verificación: el hueco **no dibuja nada** y se ve el fondo por él; las otras cuatro se distinguen sin ayuda.
- [x] 6.3 Colocar al personaje sobre la casilla de salida, mirando a donde dice la configuración, **con el saliente que marca hacia dónde mira** (design, decisión 5). Verificación: girándolo 90° se nota el cambio; un cubo simétrico no valdría.
- [x] 6.4 Usar sólo nombres de color del tema, duplicados a mano como hexadecimales con el comentario que ya lleva `CUBE_COLOR` (`CLAUDE.md`, estilos). Verificación: cada hexadecimal del archivo corresponde a un token de `tailwind.config.js`.
- [x] 6.5 Guardar la pose en un `useState` inicializado con `config.start` (design, decisión 3). Verificación: el módulo puro sigue sin estado, y quitar el `useState` sería lo único que habría que tocar para cambiar de dueño.
- [x] 6.6 Ajustar cámara y luces para que el tablero entero se vea y las caras de los muros no salgan negras. Verificación: se ven las 25 casillas en el navegador, muro incluido, sin orbitar.
- [x] 6.7 **No** instalar ni importar `@react-three/drei` (design, decisión 5). Verificación: `git diff apps/web/package.json` está vacío.
- [x] 6.8 **No** cargar ningún `.glb` de `apps/web/public/models/`. Verificación: `git status` no muestra cambios bajo `public/models/` y el archivo no menciona ningún modelo.

## 7. Las órdenes desde la consola, sólo en desarrollo

- [x] 7.1 Registrar en `window` las órdenes `forward`, `left`, `right` y `reset` desde un `useEffect` de `GameScene`, gobernado por `import.meta.env.DEV` con **acceso de miembro, nunca desestructurado**, como hace `context/guest.helpers.ts` (design, decisión 4). Verificación: en desarrollo las cuatro funciones existen en la consola del navegador y mueven al personaje.
- [x] 7.2 Retirar el registro al desmontar el componente. Verificación: al salir del banco de pruebas y volver, no quedan dos registros peleándose; la orden mueve al personaje de la escena montada.
- [x] 7.3 Tipar el añadido a `window` con un `declare global` en el mismo archivo, **sin `any`** (design, decisión 4). Verificación: `npm run lint` da 0 warnings y `npx tsc --noEmit` pasa.

## 8. La pantalla del banco de pruebas

- [x] 8.1 Actualizar `apps/web/src/components/dashboard/student/StudentGameLabModule.tsx`: el rótulo dice hoy «Un cubo, y nada más» y ya no es cierto. Verificación: el texto describe lo que se ve ahora.
- [x] 8.2 Escribir en la propia pantalla **cómo se mueve al personaje desde la consola**, con los nombres exactos de las cuatro órdenes. Verificación: se puede mover al personaje sin abrir el código.
- [x] 8.3 **No** importar `movement`, `level` ni `debugLevel` desde este archivo ni desde `GameSceneLoader.tsx` (design, decisión 6). Verificación: una búsqueda sobre `apps/web/src` confirma que sólo `GameScene.tsx` y el test los importan.

## 9. El bundle, comprobado en el build

- [x] 9.1 `npm run build` y comparar contra las cifras de 1.1. Verificación: el trozo principal **no sube** —salvo lo que costaría el módulo puro si acabara arriba, que es justo lo que no debe pasar— y lo que crece sale en el trozo del juego.
- [x] 9.2 Confirmar que `three` sigue **sólo** en el trozo aparte. Verificación: una marca inequívoca de `three` aparece en el trozo del juego y **cero veces** en el principal, como ya se comprobó en el J1.
- [x] 9.3 Confirmar que `apps/web/dist/index.html` **no precarga** el trozo del juego. Verificación: no hay ninguna etiqueta que lo pida; su nombre sólo sale dentro del principal como especificador del `import()`.
- [x] 9.4 Dejar escritas las cifras, antes y después. Verificación: las dos aparecen en el resumen final, no sólo la de después.

## 10. Ver el tablero y ver moverse al personaje

**Es el criterio del J2 y no vale ninguna otra prueba** (`ROADMAP-JUEGO.md` §3).

- [x] 10.1 Levantar el preview con la configuración `codeplay-web` de `.claude/launch.json`, puerto 5173, y abrir el banco de pruebas. Verificación: **se ve el tablero**, con su muro, su hueco, su salida y su meta.
- [x] 10.2 Llamar a las cuatro órdenes desde la consola. Verificación: avanzar mueve al personaje una casilla, girar lo deja donde está mirando a otro lado, y `reset` lo devuelve a la salida.
- [x] 10.3 Comprobar contra el muro, contra el hueco y contra el borde. Verificación: en los tres el personaje se queda donde está y sigue mirando a donde miraba.
- [x] 10.4 Leer la consola del navegador con la escena montada. Verificación: ni un error. Si se queja de internals de `three`, **no** subir fiber: arrastra React 19.
- [x] 10.5 Guardar una captura del tablero con el personaje. **Vive en la transcripción de la sesión, no en un archivo del disco**: la captura útil es la de la pantalla entera, y el `toDataURL` del lienzo sólo devuelve el lienzo, sin barras alrededor. Verificación: la captura enseña el tablero dentro del panel, con la barra lateral y la superior alrededor.

## 11. Verificación final

- [x] 11.1 `npm run lint`. Verificación: 0 errores y 0 warnings.
- [x] 11.2 `npm run test:run`. Verificación: los 109 tests de 1.2 siguen ahí **con los mismos nombres y sin tocarlos**, más los del archivo nuevo. Un total que cuadra puede esconder uno retirado y otro añadido.
- [x] 11.3 `npm run build`. Verificación: termina sin errores, incluido el `tsc` de delante.
- [x] 11.4 `npx openspec validate rejilla-y-personaje --strict`. Verificación: el cambio es válido.

## 12. Documentación

- [x] 12.1 Marcar el **J2 en ✅** en `docs/ROADMAP-JUEGO.md` §3. Verificación: la fila del J2 cambia de estado y ninguna otra se toca.
- [x] 12.2 Reescribir `docs/CONTEXT.md` §2.9 para que describa el J1 **y** el J2, con las rutas reales de los archivos nuevos. Verificación: las rutas que nombra existen en el disco, y el «sin rejilla, sin personaje» de hoy desaparece.
- [x] 12.3 Corregir en esa misma §2.9 la fila que llama a `GameScene.tsx` «el único módulo del repositorio que importa `three`»: deja de ser cierta. **Reescribirla, no borrarla**, por la regla que sí se sostiene — **nada por encima de la frontera diferida lo importa** (design, decisión 6). Verificación: la frase nueva nombra la frontera, y `GameSceneLoader.tsx` y la pantalla del laboratorio siguen sin importarlo.
- [x] 12.4 Corregir `docs/CONTEXT.md` §4.8: sigue titulando «Bundle de 623 kB» y describiendo «un solo chunk de 623,18 kB (166,96 gzip), 177 módulos» como línea de partida del juego, que es de **antes** del J1. Verificación: el título y las cifras son las de después de este paso, y el texto ya no llama línea de partida a una medida anterior al J1.
- [x] 12.5 Corregir el bloque STACK de `openspec/config.yaml` —las líneas que repiten lo de «el único módulo que importa three»— con la misma frase de 12.3. Verificación: `npx openspec doctor` no reporta errores de parseo.
- [x] 12.6 Comprobar si el cambio toca stack, estructura, convenciones o prioridades más allá de eso (`CLAUDE.md`, flujo de trabajo punto 3). Verificación: se dice qué se propagó y qué no; «revisado, sin más cambios» es un resultado válido y se escribe.

## 13. Cierre

**Son dos commits, no uno**, y el orden importa. En el J1 el archive fue su
propio commit —`0cd05a9`, aparte de `47fcb74`—, así que la secuencia real es:
implementar → parada → commit → `/opsx:archive` → Purpose → segundo commit. Cada
commit lleva su parada delante.

- [x] 13.1 **PARADA: no commitear hasta que la sesión que verifica lo haya revisado.** Verificación: se avisa y se para; no hay commit hasta que llegue el visto bueno.
- [x] 13.2 Commitear la implementación **enumerando las rutas** en `git add` (`CLAUDE.md`, flujo de trabajo punto 4). Verificación: no se usa `git add -A`, y lo que entra al índice es exactamente lo de este cambio.
- [ ] 13.3 Archivar con `/opsx:archive`. Verificación: el cambio pasa a `openspec/changes/archive/` y los deltas quedan volcados en `openspec/specs/juego-3d/spec.md`.
- [ ] 13.4 Reescribir a mano el `## Purpose` de `openspec/specs/juego-3d/spec.md`, que dice «Hoy no hay nada jugable» y describe el esqueleto. **Ningún delta lo transporta** (`ROADMAP.md` §1.3 punto 6), y en el J1 esa comprobación no llegó a hacerse: su `tasks.md` no tiene ni una tarea de Purpose, y por eso el texto de hoy sigue siendo el de antes del J1. Verificación: el Purpose describe la capacidad con rejilla y personaje, y ya no dice que no hay nada jugable.
- [ ] 13.5 **PARADA: el Purpose reescrito se revisa antes del commit del archive.** El punto 6 de `ROADMAP.md` §1.3 aplica «al revisar y al archivar», y es justo el punto donde el J1 se escapó. Verificación: se avisa con el texto nuevo delante y se espera.
- [ ] 13.6 Commitear el archive, otra vez con las rutas enumeradas. Verificación: no se usa `git add -A`, y el commit incluye el Purpose reescrito junto al volcado del archive.
