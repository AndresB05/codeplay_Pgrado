## Context

Ver `proposal.md` — Why. El método es el de `mundo-2-completo`, archivado en
`openspec/changes/archive/2026-09-14-mundo-2-completo/`, y la regla del máximo de
pasos es la de `limite-de-pasos`. Aquí sólo lo propio de este cambio.

## Goals / Non-Goals

**Goals:** que los niveles 1 y 2 del mundo 3 se jueguen desde su fila, con su
máximo de pasos.

**Non-Goals:** el nivel 3; cambiar la vista; tocar los seis niveles de los mundos
1 y 2; el XP.

## Decisions

### Los tableros, confirmados por el usuario viéndolos montados

El usuario dio cada nivel con un mapa de forma y otro de alturas, y **los dos
venían girados** respecto al boceto por tercera vez: su fila de arriba era el
borde oeste del dibujo y su columna izquierda el borde sur. Se comprobó contra
los dos dibujos, se le devolvieron con el norte arriba y **se le enseñaron
montados en el motor del juego, renderizados desde cinco ángulos**. Su respuesta:
«estos 2, son perfectos».

```
Nivel 1                      Nivel 2
     forma      alturas          forma      alturas
 P  P  P  P  M   1 1 1 1 1    P  P  P  P  ·   4 3 3 2 0
 P  ·  ·  ·  P   1 0 0 0 1    M  P  P  P  ·   5 2 2 1 0
 P  ·  ·  ·  P   1 0 0 0 1    P  P  ·  P  P   1 2 0 1 1
 P  ·  ·  ·  P   1 0 0 0 2    P  P  ·  ·  P   1 1 0 0 1
 S  P  P  P  P   1 1 1 2 1    ·  P  P  P  S   0 1 1 1 1
```

**Enseñárselo montado fue lo que resolvió la orientación de salida**, no las
palabras. Las dos salidas tienen **dos vecinas alcanzables**, así que la regla de
«mira a su única vecina» no decide, y el usuario no podía contestar en términos
de norte y sur —«no sé cuáles son tu norte y tu sur»—. Se le dio a elegir entre
dos imágenes del mismo tablero desde el mismo sitio, con el personaje mirando a
un lado y al otro, y eligió.

### Las dos salidas miran al camino MALO, y es el mismo patrón

Decidido por el usuario en los dos niveles:

- **Nivel 1, mirando al este.** De frente está el borde sur, que lleva a los dos
  pilares. Ese camino tiene **un giro menos** —se arranca sin girar— y aun así
  cuesta **11** contra **10**, porque cada pilar obliga a un salto y un salto
  cuesta dos. Es el nivel entero en una frase: menos giros no es menos pasos.
- **Nivel 2, mirando al norte.** De frente está el borde este, que **se acaba a
  dos casillas**. Con la salida mirando al oeste el mínimo habría sido 16 y el
  camino bueno estaría de frente; mirando al norte es **17** y hay que darse la
  vuelta.

### `stepLimit` = `optimalSteps` en los dos

Decidido por el usuario: en el mundo 3 pasar el nivel **es** ser óptimo, y por eso
el XP no se reparte entre las dos marcas. El formato no ata los dos números —un
nivel con margen es perfectamente legal—, así que esto es decisión de siembra y
se escribe nivel a nivel.

Consecuencia que se acepta: **el margen del nivel 1 es de un solo paso.** El niño
que tire de frente se congela en la última casilla, a un paso de la meta. Al
usuario se le dijo con el número delante y lo dejó así.

### `optimalSteps`, decididos por la búsqueda del mínimo

**10 y 17 salen de `levelSolutions.test.ts`**, que los lee del `.sql`, y **caen
con ±1**. La cuenta a mano coincide esta vez; no se fía de ella, que en el nivel 1
del mundo 2 se equivocó.

### El orden de los `update` es libre aquí, y no lo era en la 0029

`levels_world_slug_unique` se comprueba sentencia a sentencia. En la 0029 mandaba,
porque un slug cambiaba de fila. Aquí los slugs nuevos —`dos-caminos` y
`el-faro`— **no coinciden con ninguno de los tres viejos** del mundo 3
(`ola-de-errores`, `faro-asincrono`, `tormenta-final`), así que ninguna sentencia
puede chocar con otra. Se escriben en orden 1, 2 por legibilidad, no por
obligación.

### Los textos

- **Nivel 1, `dos-caminos`.** Descripción: «Hay dos maneras de rodear el agujero,
  y sólo una te alcanza.» La narrativa es la **primera del mundo**, así que le
  explica la regla nueva —el número de arriba baja y al llegar a cero se queda
  quieto— y le da el dato que decide: **saltar cuesta el doble que andar**. No
  dice por qué lado ir; decirlo sería resolverle el nivel, y decirlo mal le
  empujaría al camino de 11.
- **Nivel 2, `el-faro`.** Descripción: «Sube a lo alto del faro sin gastar un paso
  de más.» La narrativa avisa de que **por delante el suelo se acaba**, que es la
  trampa, y le pide mirar el tablero antes de colocar un bloque. No describe el
  recorrido.

El nombre sale del puzle, no al revés: `el-faro` reaprovecha el faro del Caribe
que ya daba título a esa fila, pero el puzle es otro y el título lo dice en
términos del tablero.

## Risks / Trade-offs

- **Un `update` que no case actualiza cero filas y no falla** → se miden las dos
  filas antes del `push` y se releen después, campo a campo contra el `.sql`.
- **El nivel 3 se queda rechazado** entre esta migración y la 0031 → es el estado
  esperado y la pantalla se lo explica al niño; queda escrito en `CONTEXT.md`.
- **El margen de un paso del nivel 1** → decisión tomada por el usuario con el
  número delante. Se arregla subiendo un pilar a 3, si al jugarlo no muerde.
