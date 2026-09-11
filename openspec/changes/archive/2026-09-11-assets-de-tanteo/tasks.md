## 1. Los kits en el disco

- [x] 1.1 Medir el trozo `GameScene` **antes de nada** con `npm run build` y anotar el número; sin la medida de partida, la de después no dice nada. (Referencia: 849,48 kB antes de este paso.)
- [x] 1.2 Copiar el Survival Kit a `apps/web/public/models/survival/`: los **80 GLB** de `Models/GLB format/`, su `Textures/colormap.png` **hermano de los modelos** y su `License.txt`. Sólo GLB. Verificar con un recuento de archivos y comprobando que la textura queda al lado.
- [x] 1.3 Borrar `apps/web/public/models/nature/` **por su ruta, sin comodines**, y comprobar con `git status` que no ha desaparecido nada más —en el árbol vive además el archivado del J6.3, que no es de este cambio—.
- [x] 1.4 Rehacer `apps/web/public/models/README.md`: tabla de kits, recuentos, total y «qué hay dentro» con lo que quede de verdad, y **la regla de la textura hermana escrita para los dos kits**. Verificar que no queda ninguna mención a `nature/`.

## 2. El suelo, de una pieza (`GameScene.tsx`)

- [x] 2.1 Construir la geometría del tablero en un `useMemo`: tapa de casillas a y = 0 con los dos verdes por paridad, canto de tierra sólo en el contorno —el de fuera y el del hueco— y el labio de 0,04. Verificar en la escena que es **una sola malla** y que el hueco sigue sin dibujarse.
- [x] 2.2 Poner los tres colores medidos del kit —`#57C186`, `#45AF7E`, `#E89066`— con su UV anotada al lado, y el material con `metalness` 0 para que se ilumine como los modelos. Verificar en captura que el canto del tablero y el de un `block-grass-large` del escenario **son el mismo color**.
- [x] 2.3 **Contar las cinco casillas de una fila** en la captura de la vista de partida. Si no se cuentan, bajar un téxel el verde oscuro y volver a contar. Anotar cuál quedó. **Y mirar el canto DESDE EL LADO**, no sólo el damero desde arriba: la vista de partida no enseña el canto, y ahí se escondió una rendija de 0,08 entre faldones.
- [x] 2.4 Verificar el recorrido con el suelo nuevo: PROGRAMA A de col 0/fila 4 a col 4/fila 0, contador de 1 a 10 y «¡Perfecto! …con 10 pasos», leyendo la casilla **por nombre** y comprobando antes que el `<pre>` contiene `codeplay_advance`.

## 3. Los obstáculos y la meta (`GameScene.tsx`)

- [ ] 3.1 Fila 0, columna 3: `platform.glb` **incrustada** en la cuadrícula, hundida lo justo para que su canto nazca del suelo. Verificar en captura que no se ve la junta. **NO SE HACE: el usuario cerró el J6.4 el 10-sep-2026 —hecho, no satisfactorio— y el aspecto pasa a un J13 propio, después de los puzles. Esta tarea se queda sin marcar a propósito.**
- [ ] 3.2 Las otras tres casillas, con la cuenta del código —desde 0—: **tocón en la fila 3, columna 1** —el bulto más cercano al personaje— y **rocas en la fila 1, columna 1 y en la fila 3, columna 3**. Del survival, **escalados hasta pasar de su casilla** y hundidos entre un cuarto y un tercio de su alto. Elegir la pieza mirando —no por el nombre— y mandar la captura. **NO SE HACE: el usuario cerró el J6.4 el 10-sep-2026 —hecho, no satisfactorio— y el aspecto pasa a un J13 propio, después de los puzles. Esta tarea se queda sin marcar a propósito.**
- [ ] 3.3 `flag.glb` en la meta (fila 0, columna 4), fundida con el suelo. **La salida deja de marcarse**: se quita el tinte azul y el amarillo de la meta. **NO SE HACE: el usuario cerró el J6.4 el 10-sep-2026 —hecho, no satisfactorio— y el aspecto pasa a un J13 propio, después de los puzles. Esta tarea se queda sin marcar a propósito.**
- [ ] 3.4 Verificar contra el tablero que **ningún obstáculo esconde la casilla de al lado** y que las cinco clases —pisable, obstáculo, hueco, meta y el resto— se distinguen sin ejecutar nada. **NO SE HACE: el usuario cerró el J6.4 el 10-sep-2026 —hecho, no satisfactorio— y el aspecto pasa a un J13 propio, después de los puzles. Esta tarea se queda sin marcar a propósito.**
- [ ] 3.5 Verificar el topetazo con los obstáculos nuevos: avanzar contra la casilla de la fila 1, columna 1 deja al personaje donde estaba, mirando adonde miraba. **NO SE HACE: el usuario cerró el J6.4 el 10-sep-2026 —hecho, no satisfactorio— y el aspecto pasa a un J13 propio, después de los puzles. Esta tarea se queda sin marcar a propósito.**

## 4. La decoración (`GameScene.tsx`)

- [ ] 4.1 Flores y pasto del platformer sobre casillas **pisables**, pequeños y sin colisión. Verificar ejecutando un programa que pase por una casilla adornada: el personaje la pisa y no se detiene. **NO SE HACE: el usuario cerró el J6.4 el 10-sep-2026 —hecho, no satisfactorio— y el aspecto pasa a un J13 propio, después de los puzles. Esta tarea se queda sin marcar a propósito.**
- [ ] 4.2 Verificar en captura que ningún adorno puede confundirse con un obstáculo: el tamaño es lo que los separa. **NO SE HACE: el usuario cerró el J6.4 el 10-sep-2026 —hecho, no satisfactorio— y el aspecto pasa a un J13 propio, después de los puzles. Esta tarea se queda sin marcar a propósito.**

## 5. El escenario de fuera (`GameScene.tsx`)

- [x] 5.1 Plataformas altas alrededor, con `block-grass-large` y `block-grass-large-tall`, **solapadas entre sí y con el tablero**; ninguna casilla del tablero queda tapada.
- [x] 5.2 Árboles `tree` y `tree-pine` con escalas distintas, hundidos en la plataforma que los sostiene; `rock-flat` tumbado sobre una; **la valla en una plataforma propia detrás del personaje**, al sur de la salida y fuera de la rejilla; y **la pasarela, `platform.glb`, saliendo del borde de una plataforma**. Todo fundido, nada posado.
- [x] 5.3 Verificar en captura, desde la vista de partida y desde los topes de la cámara, que **nada del escenario tapa al personaje** ni el tablero.

## 6. El personaje (`GameScene.tsx`)

- [ ] 6.1 Sustituir los dos `<mesh>` por `character-oobi.glb` con `<primitive>` —no `Clone`, que rompe el modelo con esqueleto—, girándolo media vuelta **dentro de su grupo** y sin tocar `FACING_ANGLE`. **NO SE HACE: el usuario cerró el J6.4 el 10-sep-2026 —hecho, no satisfactorio— y el aspecto pasa a un J13 propio, después de los puzles. Esta tarea se queda sin marcar a propósito.**
- [ ] 6.2 Verificar que **lo dibujado sigue a lo calculado**: comparar dos fotogramas —con el personaje visible y con `visible = false`— y comprobar que los píxeles que cambian caen sobre la casilla que dice la escena. **NO SE HACE: el usuario cerró el J6.4 el 10-sep-2026 —hecho, no satisfactorio— y el aspecto pasa a un J13 propio, después de los puzles. Esta tarea se queda sin marcar a propósito.**
- [ ] 6.3 Verificar los cuatro giros y que **se ve hacia dónde mira**; y que «Detener» lo deja **en la casilla**, no entre dos, y «Reiniciar» lo devuelve a col 0/fila 4 mirando al norte. **NO SE HACE: el usuario cerró el J6.4 el 10-sep-2026 —hecho, no satisfactorio— y el aspecto pasa a un J13 propio, después de los puzles. Esta tarea se queda sin marcar a propósito.**
- [ ] 6.4 **Repetir el barrido de inclinación con el modelo puesto.** Los 58° hasta donde aguantan los 24 azimuts se midieron contra el CUBO, y `character-oobi` mide 0,907 de alto contra 0,7, con otra silueta: el número que vale es el del modelo, y hasta entonces el 58° no se da por bueno. El que salga es el que va a §2.9. **NO SE HACE: el usuario cerró el J6.4 el 10-sep-2026 —hecho, no satisfactorio— y el aspecto pasa a un J13 propio, después de los puzles. Esta tarea se queda sin marcar a propósito.**

## 7. Cierre

- [x] 7.1 Volver a medir el trozo `GameScene` y comprobar que el **principal sigue en 625,00 kB, ni un byte más**. Anotar los dos números en `docs/CONTEXT.md` §4.8 y **corregir de paso sus cifras de partida**: el árbol da `BlockEditor` 648,40 kB y hoja 53,32, no 647,94 y 53,25 — el commit `7b5c43a` tocó los dos y no actualizó esa sección.
- [x] 7.2 Anotar en `docs/CONTEXT.md` §2.9 lo que este paso deja medido y **lo que no se pudo verificar**, y marcar el J6.4 en `docs/ROADMAP-JUEGO.md` §3 — **esa mitad queda ANULADA: el roadmap lo escribe entero la sesión que revisa, porque además crea el J13 y retira el J7.4, el J12.4 y el J12.8, y tocarlo los dos chocaría en el mismo archivo.** Tres cifras que no se pueden perder, porque son las que se caen primero el día que el J13 suba una pieza de tamaño:
  - **la casilla al noroeste del tocón se ve a 3 de 5 puntos** desde la vista de partida, y quien la tapa es el tocón;
  - **el personaje se ve desde los 24 azimuts mientras la cámara no baje de 58°** —la vista de partida está en **50,74°**, el tope de arriba en **25,71°** y el de abajo en **83,13°**—; el primer estorbo a 59° es un árbol en 1 de 24, a 61° entra el tocón, y pegado al tope se suman las plataformas, la valla y el propio tablero. **La cifra buena es la que salga del barrido con el modelo puesto (tarea 6.4), no ésta, que se midió contra el cubo;**
  - **girar una plataforma cuadrada le engorda la caja** `|cos t| + |sin t| − 1`, y por eso no se giran.
- [x] 7.3 `npm run lint`, `npm run test:run` —169 tests en 19 archivos, y **no** con `npx vitest run` desde la raíz— y `npm run build`: los tres pasan.
- [x] 7.4 **Matar el receptor de capturas** —`node /tmp/capturas.js`, en el puerto 5199— y **borrar `docs/capturas-j6.4/`**: las capturas son para decidir, no para commitear, y nada de ese andamiaje queda escrito en el repo. Avisar después a la sesión que revisa. **El commit no se hace aquí.**
