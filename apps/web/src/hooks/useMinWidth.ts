import { useEffect, useState } from 'react';

/*
 * Si la ventana mide al menos `px` de ancho. Sin `matchMedia` —en los tests, o
 * en un navegador que no lo tenga— se supone escritorio: es el caso en el que
 * todo lo de la pantalla está disponible.
 */
export const useMinWidth = (px: number): boolean => {
  const query = `(min-width: ${px}px)`;
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? true);

  useEffect(() => {
    const media = window.matchMedia?.(query);

    if (!media) {
      return undefined;
    }

    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);

    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
};
