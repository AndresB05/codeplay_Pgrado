## Context

Ver `proposal.md` — Why. El método es el del J7.2, archivado en
`openspec/changes/archive/2026-09-13-nivel-2-desde-la-base/design.md`, y las
reglas del salto y las alturas son las de `salto-y-alturas`. Aquí sólo lo propio
de este nivel.

## Goals / Non-Goals

**Goals:** que el primer nivel con subidas se juegue desde su fila.

**Non-Goals:** el nivel 1 del mundo 2, más fácil y sin diseñar; cambiar la vista.

## Decisions

### El tablero, confirmado por el usuario con un mapa de alturas

```
fila 0   ·  3M ·  ·  ·
fila 1   ·  3  3  3  3
fila 2   1  1  1  2  3
fila 3   1  ·  ·  ·  ·
fila 4   1S ·  ·  ·  ·
```

El usuario dio las casillas con un mapa desde arriba y confirmó las alturas, que
salían del boceto; varias columnas se tapan en el dibujo.

### Va en el nivel 2, no en el 1

Decidido por el usuario al pedir sembrarlo: el nivel 1 del mundo será más fácil.
La primera versión de este cambio lo apuntaba al 1 y se reescribió antes de
cualquier `push`.

### `optimalSteps` es 15, y la cuenta a mano decía 17

**El error, contado.** Leyendo el tablero se dio por bueno el camino por la
esquina —subir el escalón y la columna de altura 3 de la derecha con
`saltar [avanzar 2]` y volver por la meseta—, que cuesta 17, y se escribió «un solo
camino». **No lo es**: desde el escalón se salta directamente a la meseta hacia el
norte. La búsqueda del mínimo de `levelSolutions.test.ts` lo encontró antes de
sembrar, que es exactamente para lo que se escribió en el J7.2. Sembrar 17 habría
dejado a cualquier niño que viera el atajo batiendo «la mejor solución».

La mejor solución: `avanzar 2`, derecha, `avanzar 2`, `saltar [avanzar 1]`,
izquierda, `saltar [avanzar 1]`, izquierda, `avanzar 2`, derecha, `avanzar 1`.

### El texto

- **Título:** `Nivel 2 - Salta y sube`. **Slug:** `salta-y-sube`.
- **Descripción:** «Usa el bloque saltar para subir a lo alto de la montaña.»
- **Narrativa:** «Andando no puedes subir a una casilla más alta: mete un avanzar
  dentro del bloque saltar para subir un escalón. ¡Fíjate bien! Hay más de un
  camino hasta arriba, y no todos cuestan lo mismo.»

**La primera narrativa se retiró por el mismo error**: decía que `avanzar 2` dentro
de «saltar» sube dos escalones seguidos, que es cierto pero empuja al camino de 17.
La nueva enseña cómo se usa el bloque y avisa de que hay que elegir camino, sin
darlo.

## Risks / Trade-offs

- **Depende de la 0027**: sin ella el juego no acepta nada en la versión 1, y el
  orden de las migraciones la aplica antes. Van en el mismo `push`.
- **Un `update` que no case actualiza cero filas y no falla** → se midió la fila
  antes: una sola, `b5683cd0…`, «Mochila de Datos».
- **Un nivel 2 sin nivel 1 jugable** → el mundo 2 arranca con su nivel 1 todavía
  en el formato del juego anterior, que la lista deja abrir y enseña «todavía no
  se puede jugar». Es provisional hasta que el usuario diseñe el nivel 1.
