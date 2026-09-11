# Modelos 3D del juego

De dónde salen, qué hay aquí y qué **no** hay. La decisión de usar Kenney está en
[`docs/DISENO-DEL-JUEGO.md`](../../../../docs/DISENO-DEL-JUEGO.md) §5.

## Origen y licencia

Dos kits de [Kenney](https://kenney.nl), los dos **CC0** (dominio público): se
pueden usar en proyectos personales, educativos y comerciales, y acreditar no es
obligatorio. El texto íntegro está en el archivo de licencia de cada carpeta y
**no se borra**.

| Carpeta | Kit | Versión | Modelos | Peso |
| --- | --- | --- | --- | --- |
| `platformer/` | Platformer Kit | 4.1 | 153 | 3,06 MB |
| `survival/` | Survival Kit | 2.0 | 80 | 1,24 MB |

**El Nature Kit estuvo aquí y ya no está.** Entró el 4-sep-2026 con 329 modelos y
se retiró entero en el **J6.4**, con el aspecto del juego ya decidido: lo que hacía
falta de él —rocas y un tocón— lo da el Survival Kit, y mantener 3,7 MB de piezas
que nadie iba a pintar era guardar un kit por si acaso. Si algún día hiciera falta
otra vez, se vuelve a bajar de Kenney.

## Por qué están en `public/` y no en `src/`

Vite no procesa `public/`: lo sirve tal cual y sin renombrar. Es lo que necesita
`GLTFLoader`, que pide los modelos **por URL en tiempo de ejecución** —
`/models/platformer/character-oobi.glb`—, no por `import`. Metidos en `src/`
entrarían en el grafo del bundle, que es justo lo contrario de lo que se quiere.

## Sólo GLB, a propósito

Los kits traen además FBX, OBJ, DAE y STL, y cientos de imágenes de vista previa.
Nada de eso entra: son decenas de MB que el navegador no sabe leer. Lo que hay
aquí son **233 modelos en glTF binario, 4,30 MB en total**. Si hace falta consultar
las vistas previas para elegir una pieza, están en los `.zip` originales —el del
survival trae una `Previews/*.png` por modelo—.

## `Textures/colormap.png` no se puede mover, y esto vale para LOS DOS KITS

**Ninguno de los 233 modelos lleva su textura dentro.** Todos apuntan por ruta
relativa al mismo archivo:

```
images: [{ "uri": "Textures/colormap.png" }]
```

Se resuelve contra la URL del propio `.glb`, así que **cada `Textures/colormap.png`
tiene que seguir siendo hermano de los modelos de su carpeta**. Aplanar una carpeta
o mover el PNG deja sus modelos en blanco, **sin error en consola**.

Son dos archivos distintos y no son intercambiables: el del platformer pesa 11.140
bytes y el del survival 7.440. **Comprobado en los 233, uno a uno**: ninguno lleva
imagen dentro y ninguno apunta a otra cosa.

**Y las dos son PALETAS, no dibujos**: una rejilla de 16 × 16 celdas de color, y
cada modelo apunta con sus UV a la celda que le toca. De ahí salen los colores del
tablero que el juego dibuja por su cuenta —hierba, su tono oscuro y tierra—, para
que el suelo generado y las piezas del kit sean del mismo color exacto. El detalle
está en `docs/CONTEXT.md` §2.9.

## Qué hay dentro, en grueso

- **`platformer/`** es el kit del juego: `character-oo{bi,di,li,pi,zi}` (cinco
  personajes), 39 variantes de `block-grass*` y otras tantas de `block-snow*`,
  `platform*`, `flag`, `arrow`, `flowers`, `grass`, `fence-*`, `door-*`, `key`,
  `button-*`, `coin-*`.
- **`survival/`** es de donde salen las rocas y los tocones: `rock-{a,b,c}`,
  `rock-sand-*`, `rock-flat`, `tree-trunk`, `tree`, `tree-tall`, `tree-log*`, y
  además tiendas, herramientas, cajas y estructuras que hoy no se usan.

## Cuándo entran de verdad

**Entran con el J6.4.** La fase A del juego se hizo entera con cubos de colores, y
los modelos llegan cuando la mecánica ya funciona y se sabe qué piezas hacen
falta. La primera pantalla que los pinta es el laboratorio; el apartado gráfico
definitivo —mundo por mundo— es el **J7.4**. Ver `docs/ROADMAP-JUEGO.md` §3 y
`docs/CONTEXT.md` §2.9, que es donde se anota qué se está usando de verdad.
