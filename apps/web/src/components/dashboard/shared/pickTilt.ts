import type { MouseEvent } from 'react';

/*
 * La inclinación de lo que va sobre el pergamino. Cada vez que el cursor entra
 * se sortea el lado, para que no se incline siempre igual.
 */
export const pickTilt = (event: MouseEvent<HTMLElement>) => {
  const side = Math.random() < 0.5 ? -1 : 1;
  const degrees = 1.5 + Math.random() * 1.5;
  event.currentTarget.style.setProperty('--tilt', `${side * degrees}deg`);
};

/** Las clases que la aplican al pasar el cursor, salvo con movimiento reducido. */
export const TILT_ON_HOVER =
  'transition-transform duration-200 ease-out hover:[transform:rotate(var(--tilt))] motion-reduce:transition-none motion-reduce:hover:[transform:none]';
