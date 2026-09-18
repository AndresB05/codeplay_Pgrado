/**
 * El NIVEL EXPLORADOR: en qué tramo de XP está el niño.
 *
 * La barra del panel no va contra un techo, va contra un tramo que se llena y
 * vuelve a empezar. El tramo vale lo que da un mundo entero jugado a la
 * perfección —tres niveles a 100—, que es la regla que se le puede explicar a un
 * niño: terminas un mundo bien, subes de nivel.
 *
 * NO HAY MÁXIMO, y es deliberado: `profiles.total_xp` no está acotado y los
 * logros repartirán más XP cuando existan (paso 22), así que el tramo se
 * CALCULA en vez de enumerarse. Hasta el J11 aquí vivía `PROVISIONAL_MAX_XP =
 * 1000`, un denominador inventado que ningún dato respaldaba.
 *
 * SE LLAMA «NIVEL EXPLORADOR» y no «nivel» a secas por decisión del usuario del
 * 17-sep-2026: en la misma pantalla hay «Nivel 3 - La escalera», que es otra
 * cosa y también se numera del 1 al 3.
 *
 * Y vive aquí, y no dentro de `XPBar`, porque lo necesita quien no pinta la
 * barra: la ventana de nivel superado compara el tramo de antes con el de
 * después para anunciar la subida, y Ajustes lo enseña sin barra.
 */

/** Lo que cuesta subir un Nivel Explorador: un mundo entero perfecto. */
export const XP_PER_EXPLORER_LEVEL = 300;

/** Un XP que no sea un número utilizable cuenta como cero, nunca como negativo. */
const safeXP = (xp: number): number => (Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0);

/** Empieza en **1** con cero XP: nadie está en el nivel cero. */
export const explorerLevel = (xp: number): number =>
  Math.floor(safeXP(xp) / XP_PER_EXPLORER_LEVEL) + 1;

/** Lo que lleva dentro del tramo actual, de 0 a 299. */
export const xpIntoExplorerLevel = (xp: number): number => safeXP(xp) % XP_PER_EXPLORER_LEVEL;
