## Context

Ver `proposal.md` — Why. Lo que condiciona el diseño, medido en el repositorio a
13-sep-2026:

- **El modelo es el J7.1**: `202606030023_seed_level_1_world_1.sql` para la fila
  entera y `202606030024_level_1_vertical_board.sql` para el tablero que hoy se
  juega. La fila del nivel 2 existe desde la 0012 con slug `puente-condicional`
  y `sort_order` 2.
- **La pantalla de nivel lee la fila de la base**, así que un tablero no se puede
  ver en ella sin sembrarlo. El laboratorio (`StudentGameLabModule.tsx`) monta el
  mismo juego con un `level` por propiedades, y hoy le pasa `debugLevel`.
- **La cámara de partida es una sola para todos los niveles**:
  `CAMERA_START = [6.7, 9.5, 9.5]` en `GameScene.tsx`, escalada por el lado mayor
  del tablero contra la referencia de 5. Un 5 × 5 se ve exactamente con esa
  posición. El usuario la eligió en el J7.1 contra dos imágenes.
- **`levelConfig.test.ts` ya lee un `config` de su migración con `?raw`**, y su
  constante `previousGame` dice ser «las `validation_rules` del nivel 2», que al
  aplicar esto dejan de serlo.

## Goals / Non-Goals

**Goals:**

- Que el tablero se enseñe **jugándose y desde varias vistas** antes de que exista
  ningún `db push`.
- Que el `optimalSteps` sembrado esté **comprobado por un test**, no sólo
  razonado: que la solución llega con ese número y que no hay ninguna menor.

**Non-Goals:**

- No se toca el esquema ni la pantalla de nivel.
- No se decide el candado.
- No se añaden bloques: el nivel se resuelve con `avanzar N` y los dos giros.

## Decisions

### El boceto se traduce con el oeste a la izquierda del dibujo

El boceto es una vista isométrica. Se lee con la esquina **izquierda** del dibujo
como la **suroeste** del tablero y la de abajo como la **sureste**, que es lo que
ve la cámara de hoy, colocada al sureste. Así el niño ve el tablero como el
usuario lo dibujó, sin espejo.

```
fila 0   ·  ·  ■  ■  M
fila 1   ·  ·  ■  ·  ·
fila 2   ·  ·  ■  ·  ·
fila 3   I  ·  ■  ·  ·
fila 4   ■  ■  ■  ·  ·
```

Filas de norte a sur y columnas de oeste a este, contando desde 0 como el
contrato. Salida en `{3,0}`, meta en `{0,4}`.

**Las 15 casillas sin cubo son `gap`**, por la regla que el usuario fijó al leer
su primer boceto: la base plana del dibujo es de referencia y no cuenta para el
juego. Van escritas y no recortadas porque el tablero es rectangular (contrato
§4.2).

**La orientación de salida es `south`**, por la otra regla suya: el personaje
mira hacia la única casilla vecina de la salida a la que llega con un `avanzar`
sin chocar.

### `optimalSteps` es 12, y lo demuestra un test y no sólo la cuenta

La solución a mano:

```
avanzar 1               1   {3,0} → {4,0}
girar a la izquierda    1   mira al este
avanzar 2               2   → {4,2}
girar a la izquierda    1   mira al norte
avanzar 4               4   → {0,2}
girar a la derecha      1   mira al este
avanzar 2               2   → {0,4}, meta
                      ────
                       12
```

Por qué no hay menos: fuera del camino todo es hueco, así que el camino es único;
hay que recorrer sus 9 casillas y cambiar de dirección 3 veces, y cada cambio es
de 90° y cuesta un giro.

**Y eso se comprueba, porque nada más en el sistema lo hace.** Nace
`levelSolutions.test.ts`, que por cada nivel sembrado lee el `config` **de su
migración**:

1. ejecuta la solución escrita a mano con el intérprete y comprueba que llega a
   la meta con `countSteps` igual a `optimalSteps` — descarta un número **por
   debajo** del real;
2. calcula el mínimo con una **búsqueda en anchura sobre (casilla, orientación)**,
   donde avanzar una casilla y girar cuestan 1 — descarta un número **por
   encima**.

La búsqueda cuenta igual que el contrato §4.4 porque `avanzar N` cuesta lo mismo
que N veces `avanzar 1`, y chocar gasta pasos sin mover, así que un camino mínimo
nunca choca. Vive **en el test y no en la aplicación**: nadie en producción
necesita calcular óptimos, y el día que haga falta el sitio es el sembrado.

**Alternativa descartada: confiar en la cuenta escrita en el SQL**, que es lo que
hicieron la 0023 y la 0024. Para un camino recto de una fila bastaba; con giros y
huecos, la cuenta a mano ya tiene sitio para equivocarse, y el error no da
ningún aviso en ningún sitio.

### El tablero se enseña en el laboratorio, leído del archivo de migración

Para jugarlo antes de sembrarlo, el laboratorio pasa a montar **el `config` leído
del propio `.sql`** en vez de `debugLevel`, con el mismo `?raw` que el test.
Así lo que el usuario ve es **byte a byte** lo que se va a sembrar, y si lo
rediseña se edita ese archivo, que todavía no está aplicado y por tanto sí se
puede editar.

**Es temporal y se revierte antes del commit**: el laboratorio vuelve a
`debugLevel`, que es la rejilla contra la que están medidos sus números.

**Alternativa descartada: sembrar y mirar en la pantalla de nivel**, que es lo
que hizo el J7.1 y le costó la 0024.

### Las vistas se enseñan como imágenes, y la elegida vale para todos los niveles

Se capturan **cuatro** vistas desde la pantalla, con el mismo radio y distinto
azimut o altura, y se mandan como PNG:

| Vista | Posición | Qué enseña |
| --- | --- | --- |
| La de hoy | `[6.7, 9.5, 9.5]` | La que el usuario eligió en el J7.1, azimut ~35° |
| Isométrica | `[8.2, 9.5, 8.2]` | Azimut 45°, como el boceto |
| Frontal | `[0, 9.5, 11.6]` | Desde el sur, sin lateral |
| Alta | `[4.7, 12.5, 6.7]` | Más cenital, mismo azimut que la de hoy |

Si elige otra, cambia `CAMERA_START` y con él **el nivel 1 también**, porque el
encuadre es uno. Se le dice antes de aplicarlo. Y **`BOARD_LIFT` se vuelve a
medir** con la vista nueva: está ajustado para que el tablero no toque la bandeja
del lienzo desde la vista de hoy, y otro ángulo proyecta distinto.

### El texto del nivel

- **Título:** `Nivel 2 - Camino con curvas`. **Slug:** `camino-con-curvas`.
- **Descripción** (la tarjeta de la lista): «Avanza y gira para seguir el camino
  hasta la meta.»
- **Narrativa** (el panel de «Instrucciones», que el niño lee mientras
  construye): «Usa avanzar y los giros para seguir el camino hasta la meta.
  ¡Truco! Puedes cambiar el número del bloque avanzar: en vez de poner cuatro
  bloques de avanzar 1, pon uno solo con el número 4.»

**El truco va en la narrativa y no en la descripción** aunque el usuario dijo
«descripción»: la descripción sólo se ve en la tarjeta de la lista, antes de
entrar, y el truco sirve **mientras** se colocan bloques. Se le dice y lo decide
él con la pantalla delante.

## Risks / Trade-offs

- **Un rediseño después del `db push` cuesta otra migración** → Por eso el
  tablero, las vistas y el texto se enseñan antes, y la migración se escribe
  pero no se aplica hasta que el usuario lo diga.
- **Cambiar la vista mueve también el nivel 1**, que el usuario ya aprobó desde
  la vista de hoy → Se le enseña el nivel 1 con la vista elegida antes de dejarla.
- **El editor deja de publicar de forma intermitente** (`CONTEXT.md` §4.10) →
  Toda verificación del recorrido mira las dos señales de ese apartado, y la
  prueba es dónde está el personaje, no lo que dice la barra.
- **Un `update` cuyo `where` no case actualiza cero filas y no falla** → Se mide
  la fila antes del `push` y se compara después.

## Migration Plan

1. Se escribe la 0025 y se enseña el tablero en el laboratorio leyéndola.
2. El usuario elige vista y da el tablero y el texto por buenos; mientras, la
   migración se puede editar.
3. Se mide la fila del nivel 2 en la base —slug, título, `validation_rules`—.
4. Se le cuenta al usuario en palabras qué fila toca y con qué valores, y **él
   lanza `npx supabase db push`**.
5. Se vuelve a leer la fila y se compara con lo medido en el paso 3.
6. **Vuelta atrás:** no la hay por edición. Si lo sembrado está mal, otra
   migración.
