## Context

Ver `proposal.md` — Why. El método es el de `nivel-2-mundo-2`, archivado en
`openspec/changes/archive/2026-09-13-nivel-2-mundo-2/`, y las reglas del salto y
las alturas son las de `salto-y-alturas`. Aquí sólo lo propio de este cambio.

## Goals / Non-Goals

**Goals:** que los tres niveles del mundo 2 se jueguen desde su fila.

**Non-Goals:** el mundo 3; cambiar la vista; tocar el tablero de «Salta y sube».

## Decisions

### Los tableros, confirmados por el usuario con el norte arriba

El usuario dio cada nivel con un mapa de forma y otro de alturas. **Los dos
venían girados respecto al boceto**: su fila de arriba era el borde oeste del
dibujo y su columna izquierda el borde sur. Se comprobó contra los dos dibujos —el
muro alto del nivel 2 y la franja vacía del nivel 3 caen donde dice el giro— y el
usuario confirmó los mapas con el norte arriba, que son los que se siembran:

```
Nivel 2                 Nivel 3
fila 0   2  1  1  2  3M     ·  ·  4  3  ·
fila 1   2  ·  ·  ·  ·      ·  6M 4  2  ·
fila 2   2  ·  1S 1  1      ·  6  5  2  ·
fila 3   2  2  ·  ·  1      1  1  1  1  ·
fila 4   ·  1  1  1  1      1S ·  ·  ·  ·
```

Las dos salidas tienen una sola vecina, así que la orientación sale de la regla
del usuario sin preguntar: **este** en el nivel 2 y **norte** en el nivel 3.

### Una migración y el orden de sus `update`

`levels_world_slug_unique` se comprueba sentencia a sentencia, y `salta-y-sube`
ocupa el nivel 2 hasta que se reescribe. **El `update` del nivel 2 va antes que
el del 1**; al revés, el primero fallaría y el `push` entero se pararía. El 0028
no se edita: está aplicado.

### `optimalSteps`, decididos por la búsqueda del mínimo

25 y 23 salen de `levelSolutions.test.ts`, que lee la 0029, y **caen con ±1** en
el `.sql`. Coinciden con la cuenta a mano, y no se fía de ella: en el nivel 1 la
cuenta a mano se equivocó.

### Los textos

- **Nivel 1:** sólo cambia el título. La narrativa sigue avisando de que hay más
  de un camino, que es verdad y no empuja a ninguno.
- **Nivel 2, `el-gran-rodeo`.** Descripción: «Rodea el valle, sube al muro y
  llega a lo más alto.» Narrativa: recuerda que saltando se sube un escalón y
  que para bajar basta andar. Hay un solo camino, así que no puede empujar a uno
  peor.
- **Nivel 3, `la-torre`.** Descripción: «Sube hasta lo más alto de la torre,
  escalón a escalón.» Narrativa: pide mirar la casilla de delante antes de saltar
  y buscar otro camino si está dos escalones más arriba. Es la regla que decide el
  nivel, no un recorrido.

## Risks / Trade-offs

- **Un `update` que no case actualiza cero filas y no falla** → se miden las tres
  filas antes del `push` y se releen después.
- **El progreso va por `level_id`, no por posición** → quien tuviera progreso en la
  fila `b5683cd0…` lo tendría ahora en «El gran rodeo». Nadie lo tiene desde el
  juego: el J9, que manda el intento, no existe.
