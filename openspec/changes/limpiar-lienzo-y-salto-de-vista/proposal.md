## Why

En la prueba preliminar del 25-sep-2026 salieron dos cosas del lienzo de bloques.
Una es un fallo: al devolver a la caja un montón de varios bloques, la vista del
lienzo salta miles de píxeles y los bloques que quedan desaparecen por arriba; el
niño tiene que subir con la barra para encontrarlos. La otra es un botón que ya
no sirve: «Reiniciar» devuelve al personaje a la salida, y eso ya lo hace
«Ejecutar» cada vez que se pulsa. El usuario decidió que pase a vaciar el lienzo.

## What Changes

- **Arreglo:** devolver a la caja un montón de bloques ya no mueve la vista del
  lienzo. Causa medida el 14-oct-2026: Blockly 12, al desechar el bloque que
  vuelve a la caja, pasa el foco a su hijo y desplaza la vista hasta él
  (`scrollBoundsIntoView`), y la posición del hijo sale disparatada porque
  Blockly lee también el `style.transform` que pinta el vuelo. Medido: vista de
  `viewTop` 350 a 16 938 con un lienzo de 1 242 de alto.
- **«Reiniciar» pasa a ser «Limpiar»:** quita todos los bloques del lienzo, tras
  una confirmación, y deja al personaje en la salida. Se desactiva con el lienzo
  vacío y mientras el recorrido está en marcha.
- **El bloqueo del recorrido detenido cambia de salida.** Hoy dice «pulsa
  Reiniciar para cambiar los bloques»; sin ese botón, el propio bloqueo ofrece
  «Cambiar los bloques», que devuelve al personaje a la salida y conserva el
  lienzo. Elegido por el usuario el 14-oct-2026 (ver design.md, D3).
- Los textos que mandaban a «Reiniciar» —recorrido detenido y sin pasos— dejan
  de nombrarlo.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `juego-3d`: se añade que devolver bloques a la caja no mueve la vista del
  lienzo y el requisito de «Limpiar»; cambia cómo se sale del bloqueo del
  recorrido detenido.

## Impact

- `apps/web/src/game/BlockEditor.tsx` — `flyBackToBox` (el arreglo) y una vía
  para vaciar el lienzo desde fuera.
- `apps/web/src/game/GameScene.tsx` — el botón, su confirmación y los textos
  `OUTCOME_MESSAGES.stopped` y `OUT_OF_STEPS_MESSAGE`.
- `apps/web/src/game/BlockEditorLoader.tsx`, `apps/web/src/game/GameSceneLoader.tsx`
  — pasan la nueva propiedad.
- `apps/web/src/components/dashboard/student/StudentLevelModule.tsx` y
  `StudentGameLabModule.tsx` — las dos composiciones que poseen el lienzo
  conectan «Limpiar» con el editor.
- `apps/web/src/components/dashboard/student/HaltedLock.tsx` — texto y botón.
- Reutiliza `apps/web/src/components/dashboard/shared/ConfirmDialog.tsx`.
- **No toca Supabase:** ni esquema ni datos, no hace falta `db push`.
