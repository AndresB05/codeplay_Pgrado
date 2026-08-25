import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { Canopy, MonsteraLeaf, Toucan, TropicalFlower } from '../decor/JungleDecor';
import { ImagePlaceholder, SectionContainer } from './shared';

export const HeroSection = () => {
  return (
    <section className="jungle-surface relative overflow-hidden">
      <Canopy />

      <SectionContainer className="relative z-10 grid grid-cols-1 items-center gap-14 py-[48px] sm:py-[56px] lg:grid-cols-[1fr_400px] lg:gap-[72px] lg:py-[64px]">
        <div className="max-w-[575px] pt-1">
          <span className="chip chip-leaf">
            <TropicalFlower size={18} />
            Expedición para exploradores
          </span>

          <h1 className="mt-4 max-w-[520px] font-display text-[38px] leading-[1.05] text-grape-dark sm:text-[48px] lg:text-[58px]">
            ¡Aprender a programar jugando!
          </h1>

          <p className="mt-[22px] max-w-[560px] text-[17px] font-semibold leading-[1.7] text-ink-soft">
            Desarrolla el pensamiento computacional mientras cruzas la selva del código. Una
            plataforma hecha para que los niños descubran el poder de programar de forma divertida y
            segura.
          </p>

          <div className="mt-[28px] flex flex-wrap items-center gap-3">
            <Link to={ROUTES.SIGNUP} className="btn btn-grape">
              Inicia tu aventura
              <span aria-hidden="true">→</span>
            </Link>

            <a href="#como-aprender" className="btn btn-ghost">
              ¿Cómo se juega?
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="chip chip-sun">🌿 3 mundos abiertos</span>
            <span className="chip chip-mint">👦 Para niños de 7 a 14</span>
          </div>
        </div>

        <div className="relative flex justify-center lg:relative lg:left-[-170px] lg:justify-center">
          {/* Marco de la mascota: la ilustración llega después, el hueco se queda. */}
          <MonsteraLeaf
            size={92}
            className="absolute -left-6 -top-8 z-10 rotate-[22deg]"
            color="#1F9D5B"
          />
          <Toucan size={86} className="absolute -bottom-6 -right-4 z-10 rotate-[-8deg]" />

          <ImagePlaceholder className="h-[320px] w-full max-w-[400px] rounded-[2px] sm:h-[380px] lg:h-[460px] lg:w-[500px] lg:max-w-[500px]" />
        </div>
      </SectionContainer>
    </section>
  );
};
