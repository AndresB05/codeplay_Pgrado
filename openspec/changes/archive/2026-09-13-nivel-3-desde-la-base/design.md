## Context

Ver `proposal.md` — Why. **El diseño es el del J7.2**, archivado en
`openspec/changes/archive/2026-09-13-nivel-2-desde-la-base/design.md`, y no se
repite aquí: la lectura del boceto con la esquina izquierda como suroeste, las
casillas sin cubo como `gap`, la orientación de salida hacia la única vecina
pisable, el tablero enseñado en el laboratorio leyendo el `.sql`, y el
`optimalSteps` comprobado por `levelSolutions.test.ts` en las dos direcciones.

Lo único que este nivel añade está abajo.

## Goals / Non-Goals

**Goals:**

- Cerrar el mundo 1 con los tres niveles jugándose desde su fila.

**Non-Goals:**

- **No se construye «repetir»**, decidido por el usuario. Tampoco se elige otra
  vista: la de hoy vale para todos.

## Decisions

### El tablero

```
fila 0   ·  ·  ■  ■  ■
fila 1   ·  ■  ■  ·  ■
fila 2   ■  ■  ·  ·  ■
fila 3   ■  ·  ·  ·  M
fila 4   ■  ■  I  ·  ·
```

Salida en `{4,2}` mirando al **oeste** y meta en `{3,4}`. El usuario confirmó el
mapa antes de escribir la migración: varios cubos del boceto se tapan entre sí y
las casillas se dedujeron por su posición.

**La meta queda a dos casillas de la salida en línea recta, separada por
huecos.** No es un error de dibujo: el niño que intente atajar recibe «ahí no
hay suelo», y el camino es la vuelta entera.

### `optimalSteps` es 20

La solución —la misma que lleva el comentario de la migración y el test— recorre
13 casillas con 7 giros: `avanzar 2`, derecha, `avanzar 2`, derecha,
`avanzar 1`, izquierda, `avanzar 1`, derecha, `avanzar 1`, izquierda,
`avanzar 1`, derecha, `avanzar 2`, derecha, `avanzar 3`. El camino es único y
cada cambio de dirección es de 90°, así que no hay nada que ahorrar; la búsqueda
en anchura del test lo confirma.

**Son 15 bloques**, bastantes más que los 7 del nivel 2. Sin «repetir» no hay
forma de escribirlo más corto, y el usuario lo decidió sabiéndolo.

### El texto

- **Título:** `Nivel 3 - La escalera`. **Slug:** `la-escalera`.
- **Descripción:** «Da la vuelta al tablero y sube la escalera hasta la meta.»
- **Narrativa:** «La meta parece cerca, pero no hay suelo en medio: tienes que
  dar la vuelta. ¡Ojo con la escalera! Antes de cada giro, fíjate hacia dónde
  mira el personaje: a veces toca girar a la derecha y a veces a la izquierda.»

La narrativa avisa de las dos cosas en las que este nivel se diferencia de los
anteriores: el atajo que no existe y la alternancia de giros, que es donde se
equivoca quien piensa en izquierda y derecha de la pantalla y no del personaje.

## Risks / Trade-offs

- **Un rediseño después del `db push` cuesta otra migración** → El tablero se
  enseña antes, y la migración no se aplica hasta que el usuario lo diga.
- **Un `update` cuyo `where` no case actualiza cero filas y no falla** → Se mide
  la fila antes del `push` y se compara después.
- **El editor deja de publicar de forma intermitente** (`CONTEXT.md` §4.10) → La
  prueba es dónde está el personaje, leído de la escena.
