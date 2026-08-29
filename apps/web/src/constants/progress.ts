/**
 * Máximo provisional de la barra de XP.
 *
 * El esquema no tiene niveles ni umbrales de XP: `profiles.total_xp` es un
 * acumulado sin techo, y no hay tabla que diga cuánto hace falta para subir de
 * nivel. Diseñar esa progresión es el paso 22, y hasta entonces la barra necesita
 * un denominador. Se hereda el que ya usaba `WelcomeBanner` para no estrenar un
 * número distinto.
 */
export const PROVISIONAL_MAX_XP = 1000;
