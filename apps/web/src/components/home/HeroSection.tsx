import { Link } from 'react-router-dom';
import heroLeopard from '../../assets/brand/hero-leopard.webp';
import { ROUTES } from '../../constants/routes';
import { Canopy, TropicalFlower } from '../decor/JungleDecor';
import { SectionContainer } from './shared';

export const HeroSection = () => {
  return (
    <section className="jungle-surface relative overflow-hidden">
      <Canopy />

      {/*
       * La ilustración cubre el hero entero, anclada a la derecha para que el
       * leopardo no se corte al estrechar la pantalla. El degradado tapa la
       * mitad izquierda, que es donde va el texto.
       */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <img
          src={heroLeopard}
          alt=""
          className="h-full w-full object-cover object-[100%_40%] xl:object-[80%_40%]"
        />
        <div className="absolute inset-y-0 left-0 w-[65%] bg-gradient-to-r from-lavender from-15% via-lavender/60 to-transparent" />
      </div>

      <SectionContainer className="relative z-10 flex items-center py-[48px] sm:py-[56px] lg:min-h-[600px] lg:py-[64px]">
        <div className="w-full max-w-[575px] pt-1">
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

          {/* En una sola columna no hay lado derecho: la ilustración baja debajo del texto. */}
          <img
            src={heroLeopard}
            alt=""
            className="mt-10 aspect-[4/3] w-full rounded-[24px] border-[3px] border-ink object-cover object-[85%_50%] lg:hidden"
          />
        </div>
      </SectionContainer>
    </section>
  );
};
