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
            <span className="chip chip-grape ml-auto">Un cubo, y nada más</span>
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

        <p className="mt-4 text-[15px] font-semibold leading-[1.6] text-ink-soft">
          Esta pantalla no forma parte del producto: existe únicamente cuando la aplicación se
          ejecuta en desarrollo, y en la compilación de producción no hay forma de llegar a ella.
        </p>
      </section>
    </div>
  );
};
