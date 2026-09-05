import { GameSceneLoader } from '../../../game/GameSceneLoader';
import { MonsteraLeaf, PalmFrond } from '../../decor/JungleDecor';

const CubeIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
      fill="#F0E6FF"
      stroke="#2A1B45"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M4 7.5L12 12L20 7.5M12 12V21"
      stroke="#2A1B45"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  </svg>
);

/*
 * El banco de pruebas de la fase A del juego, y NO es de usar y tirar: el J2, el
 * J4, el J5 y el J6 se ven funcionar aquí, porque la pantalla de nivel real no
 * llega hasta el J8. Cuando ésa exista, esta pantalla se revisa.
 */
export const StudentGameLabModule = () => {
  return (
    <div className="px-5 py-5">
      <section className="card relative overflow-hidden px-5 py-5">
        <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-grape-soft" />
        <PalmFrond
          size={84}
          className="pointer-events-none absolute -left-6 -bottom-10 rotate-[18deg] opacity-80"
        />

        <div className="relative flex flex-wrap items-center gap-4">
          <span className="flex h-[56px] w-[56px] items-center justify-center rounded-[18px] border-[3px] border-ink bg-grape-soft shadow-[0_4px_0_rgba(42,27,69,0.2)]">
            <CubeIcon />
          </span>

          <div>
            <h1 className="title-xl">Laboratorio 3D</h1>
            <p className="subtitle mt-1">
              El banco de pruebas del juego. Aquí se ve funcionar cada pieza antes de que exista la
              pantalla de nivel.
            </p>
          </div>

          <span className="chip chip-coral ml-auto">Sólo en desarrollo</span>
        </div>
      </section>

      <section className="mt-8">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b-[3px] border-ink bg-cream px-5 py-3">
            <MonsteraLeaf size={22} />
            <h2 className="font-display text-[19px] text-ink">Escena</h2>
            <span className="chip chip-grape ml-auto">Tablero de pruebas, sin puzle</span>
          </div>

          {/*
           * Altura fija a propósito: `<Canvas>` se ajusta a su padre, y un padre
           * sin altura lo deja en cero. Si la escena no se ve, éste es el primer
           * sospechoso.
           */}
          <div className="h-[420px] w-full bg-cream">
            <GameSceneLoader />
          </div>
        </div>

        <div className="card mt-6 px-5 py-4">
          <h3 className="font-display text-[17px] text-ink">Mover al personaje</h3>
          <p className="mt-2 text-[15px] font-semibold leading-[1.6] text-ink-soft">
            Todavía no hay bloques —llegan más adelante—, así que las órdenes se dan de una en una
            desde la consola del navegador:
          </p>
          <ul className="mt-3 space-y-1.5 text-[15px] font-semibold leading-[1.6] text-ink-soft">
            <li>
              <code className="rounded-md bg-lavender px-2 py-0.5 text-ink">
                codeplayGame.forward()
              </code>{' '}
              — avanza una casilla, si se puede pisar
            </li>
            <li>
              <code className="rounded-md bg-lavender px-2 py-0.5 text-ink">
                codeplayGame.left()
              </code>{' '}
              y{' '}
              <code className="rounded-md bg-lavender px-2 py-0.5 text-ink">
                codeplayGame.right()
              </code>{' '}
              — giran sin cambiar de casilla
            </li>
            <li>
              <code className="rounded-md bg-lavender px-2 py-0.5 text-ink">
                codeplayGame.reset()
              </code>{' '}
              — devuelve al personaje a la salida
            </li>
          </ul>
          <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-ink-soft">
            El tablero no es un puzle: es una rejilla de prueba con un muro y un hueco, para poder
            ver qué pasa al chocar contra cada cosa.
          </p>
        </div>

        <p className="mt-4 text-[15px] font-semibold leading-[1.6] text-ink-soft">
          Esta pantalla no forma parte del producto: existe únicamente cuando la aplicación se
          ejecuta en desarrollo, y en la compilación de producción no hay forma de llegar a ella.
          Las órdenes de arriba tampoco existen fuera de desarrollo.
        </p>
      </section>
    </div>
  );
};
