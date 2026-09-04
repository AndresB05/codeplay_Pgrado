# Modelos 3D del juego

De dónde salen, qué hay aquí y qué **no** hay. La decisión de usar Kenney está en
[`docs/DISENO-DEL-JUEGO.md`](../../../../docs/DISENO-DEL-JUEGO.md) §5.

## Origen y licencia

Dos kits de [Kenney](https://kenney.nl), los dos **CC0** (dominio público): se
pueden usar en proyectos personales, educativos y comerciales, y acreditar no es
obligatorio. El texto íntegro está en el `LICENSE.txt` de cada carpeta y **no se
borra**.

| Carpeta | Kit | Versión | Modelos |
| --- | --- | --- | --- |
| `nature/` | Nature Kit | 2.1 | 329 |
| `platformer/` | Platformer Kit | 4.1 | 153 |

## Por qué están en `public/` y no en `src/`

Vite no procesa `public/`: lo sirve tal cual y sin renombrar. Es lo que necesita
`GLTFLoader`, que pide los modelos **por URL en tiempo de ejecución** —
`/models/platformer/character-oobi.glb`—, no por `import`. Metidos en `src/`
entrarían en el grafo del bundle, que es justo lo contrario de lo que se quiere.

## Sólo GLB, a propósito

Los kits traen además FBX, OBJ, DAE y STL, y unas 1.800 imágenes de vista previa.
Nada de eso entra: son unos 30 MB que el navegador no sabe leer. Lo que hay aquí
son 482 modelos en glTF binario, **5,96 MB en total**. Si hace falta consultar las
vistas previas para elegir una pieza, están en los `.zip` originales.

## `platformer/Textures/` no se puede mover

**Los 153 modelos de `platformer/` no llevan su textura dentro.** Los 153
apuntan por ruta relativa al mismo archivo:

```
images: [{ "uri": "Textures/colormap.png" }]
```

Se resuelve contra la URL del propio `.glb`, así que `Textures/colormap.png`
tiene que seguir siendo hermano de los modelos. Aplanar la carpeta o mover el PNG
deja los 153 modelos en blanco, **sin error en consola**.

Los 329 de `nature/` sí son autocontenidos: colorean por material, sin texturas.
Comprobado en los 482, uno a uno.

## Qué hay dentro, en grueso

- **`platformer/`** es el kit del juego: `character-oo{bi,di,li,pi,zi}` (cinco
  personajes), 39 variantes de `block-grass*` para la rejilla, `flag`, `arrow`,
  `arrows`, `door-*`, `key`, `button-*`, `coin-*`.
- **`nature/`** es el decorado: 61 árboles, 56 piezas de acantilado, 21 de
  camino (`ground_path*`), 16 de puente, flores, arbustos y estatuas.

## Cuándo entran de verdad

**Todavía no.** `docs/ROADMAP-JUEGO.md` §2 lo deja escrito: la fase A del juego se
hace entera con cubos de colores, y los modelos entran cuando la mecánica ya
funciona, que es cuando se sabe qué piezas hacen falta. Están aquí para no tener
que buscarlos ese día.
