# Originales de ilustraciones

Versiones a resolución completa de imágenes que en `src/assets/brand/` se
sirven reducidas. Esta carpeta queda fuera de `src` y de `public`, así que Vite
no la empaqueta: no la importes desde el código.

Cada imagen se reduce a 2× del ancho máximo con que se pinta, medido de 360 a
1920 px de ventana, y en webp q85. Si una pantalla pasa a pintarla más grande,
hay que volver a generarla desde aquí.

| Archivo | Original | Servida | Ancho máximo pintado |
| --- | --- | --- | --- |
| `world-banner-child.webp` | 1800×810 | 1360×612 | 680 px (mundos del niño) |
| `signup-child.webp` | 1440×542 | 960×361 | 478 px (registro) |
| `signup-tutor.webp` | 1440×542 | 960×361 | 478 px (registro) |
| `signup-form-child.webp` | 1469×829 | 890×502 | 443 px (formulario de registro) |

`world-{1,2,3}.webp` no están aquí: sus originales siguen en `src/assets/brand/`
porque la portada los usa, y la tarjeta del niño usa las variantes `-card`.
