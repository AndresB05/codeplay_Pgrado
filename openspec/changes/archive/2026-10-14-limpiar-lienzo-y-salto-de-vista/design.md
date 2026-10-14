## Context

**El salto de la vista, medido el 14-oct-2026** en la pantalla de nivel (dev,
1440×900), con tres montones de tres bloques en y 10, 400 y 800 y la vista
bajada hasta el del medio (`viewTop` 350). Arrastrar el del medio hasta la
bandeja deja `viewTop` en **16 938**, con un lienzo de 1 242 de alto: los dos
montones que quedan, a −16 969 y −16 138 px del borde del lienzo.

La traza, instrumentando `scrollBoundsIntoView` y `BlockSvg.onNodeFocus`:

1. Al soltar, el `endDrag` de Blockly 12 enfoca el bloque soltado. Con esta
   geometría no mueve la vista, pero es el mismo mecanismo que el paso 3.
2. `flyBackToBox` pinta el vuelo con `style.transform` sobre el SVG del propio
   bloque. Blockly **lee también ese estilo** al calcular posiciones
   (`getRelativeToSurfaceXY`): durante el vuelo el alto del contenido crece de
   1 031 a 7 631.
3. Al acabar el vuelo, `block.dispose(false)`. El `FocusManager` de Blockly 12,
   al desechar el bloque enfocado, **pasa el foco a su hijo** —que aún existe— y
   `onNodeFocus` llama a `scrollBoundsIntoView` con la posición del hijo, que
   hereda el transform del vuelo: y 17 391. La vista se va allí.

Por eso «a veces»: hace falta sacar un montón con algo encadenado debajo. Un
bloque suelto no tiene hijo al que pasar el foco.

**«Reiniciar»** es `reset()` en `GameScene.tsx`: anula el intento, pone el índice
a cero y quita el detenido. No toca los bloques. El lienzo es de `BlockEditor`,
y los dos son hermanos bajo la composición —`StudentLevelModule` y
`StudentGameLabModule`—, cada uno detrás de su frontera diferida.

## Goals / Non-Goals

**Goals:**
- Que devolver bloques a la caja no mueva la vista, venga de donde venga el foco.
- «Limpiar» con confirmación, alcanzando el lienzo sin romper las fronteras
  diferidas.
- Que el recorrido detenido siga teniendo una salida que conserve los bloques.

**Non-Goals:**
- Deshacer la limpieza. La confirmación es la protección.
- Tocar el desplazamiento de foco de Blockly fuera de los bloques que vuelven a
  la caja (navegación con teclado).
- Rehacer `ConfirmDialog`, que lleva hex sueltos de antes de este cambio.

## Decisions

### D1. Ignorar el desplazamiento al foco mientras un bloque sale del lienzo

Se sobrescribe `scrollBoundsIntoView` **en la instancia** del lienzo, como ya se
hace con los métodos del flyout en el mismo archivo, para que no haga nada
mientras haya un bloque soltado fuera del lienzo o en vuelo hacia la caja
(`drop` fuera del lienzo, o `inTheAir > 0`). El resto del tiempo delega en el
original.

Cubre los dos puntos de la traza —el `endDrag` y el `dispose`— con una sola
regla, y vale para cualquier geometría: con la bandeja por debajo del lienzo,
el paso 1 sí movería la vista.

Alternativas descartadas:
- **Quitar el `style.transform` antes del `dispose`.** Arregla la cifra
  disparatada pero no el desplazamiento: el foco pasaría al hijo en el punto
  donde se soltó, fuera del lienzo, y la vista seguiría yendo hacia él. Se hace
  igual, como higiene (D1b): el bloque que se desecha no debe llevar un estilo
  que Blockly malinterpreta.
- **Enfocar el lienzo antes del `dispose`.** Tapa el paso 3 pero no el 1, y
  depende de cómo decida Blockly a quién pasar el foco, que ya cambió de la 11 a
  la 12.
- **Animar una copia.** Ya descartado en el código: la copia pierde los filtros.

### D2. «Limpiar» viaja como señal, no como referencia al lienzo

- `GameScene` pinta el botón y su `ConfirmDialog`. Al confirmar llama a su
  `reset()` y a una nueva `onClear` que le pasa la composición.
- La composición guarda un contador `clearSignal` y lo sube en `onClear`.
- `BlockEditor` recibe `clearSignal` y, cuando cambia —no al montar—, hace
  `workspace.clear()`. Eso dispara los eventos de borrado, y el oyente que ya
  existe publica el programa vacío hacia arriba.

Un número cruza la frontera diferida como dato, igual que `flyoutHost`. Pasar
el `WorkspaceSvg` hacia arriba metería un tipo de Blockly en la composición.

El diálogo va por `createPortal` a `document.body`: los botones ya viven en un
portal dentro de la columna del lienzo, y un `fixed` dentro de un ancestro con
`transform` o `backdrop-filter` deja de cubrir la pantalla.

Desactivado: con el programa vacío —`GameScene` ya recibe `program`— y con
`isRunning`.

### D3. El bloqueo de detenido lleva su propio botón — elegido por el usuario el 14-oct-2026

Sin «Reiniciar», el niño que detiene y quiere cambiar los bloques sólo tendría
«Limpiar», que se los lleva. Se propone que `HaltedLock` ofrezca **«Cambiar los
bloques»**: devuelve al personaje a la salida y levanta el bloqueo, con el
lienzo intacto. Llega a `GameScene` con el mismo mecanismo de D2: un contador
`restartSignal` en la composición que `GameScene` escucha para llamar a
`reset()`. Remontar la escena con `key`, como hace «Volver a intentar», recarga
el 3D, y el laboratorio no tiene clave.

El botón va sólo en el bloqueo del lienzo; el de la caja sigue siendo un velo.

Alternativa: que pulsar «Detener» no bloquee y se pueda editar. Choca con la
decisión del 14-sep-2026 —lo que se reanuda es lo que está a la vista—, así que
no se propone sin el usuario.

### D4. Textos

- `OUTCOME_MESSAGES.stopped`: «Has detenido el recorrido. Pulsa «Ejecutar» para
  seguir o «Cambiar los bloques» para tocar tu programa.»
- `OUT_OF_STEPS_MESSAGE`: «Te quedaste sin pasos y el personaje no puede seguir.
  Busca un camino más corto y vuelve a pulsar «Ejecutar».»
- Confirmación: título «¿Quitar todos los bloques?», cuerpo «Se borrarán todos
  los bloques del lienzo y tendrás que empezar de nuevo.», botones «Sí, quitar
  todo» y «No, dejarlos».

## Risks / Trade-offs

- **Sobrescribir un método de Blockly** se puede romper al actualizarlo. Mitiga:
  la firma es pública y estable, y la prueba de la tarea 3.x reproduce el fallo
  midiendo `viewTop`.
- **D1 también desactiva el desplazamiento legítimo** durante los 320 ms del
  vuelo. Nadie lo pide en ese rato: el niño acaba de soltar.
- **No hay tests de componente para `BlockEditor` ni `GameScene`** —Blockly y
  three no corren en jsdom—. La verificación del salto es en navegador, con el
  mismo guion de la medición, antes y después.
- **`ConfirmDialog` usa hex sueltos.** Se reutiliza tal cual; arreglarlo es otro
  cambio.
