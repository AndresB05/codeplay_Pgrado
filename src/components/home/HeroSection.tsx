import { SectionContainer, ImagePlaceholder } from './shared';

export const HeroSection = () => {
  return (
    <section className="bg-[#F6F3FA]">
      <SectionContainer className="grid grid-cols-1 items-center gap-14 py-[48px] sm:py-[56px] lg:grid-cols-[1fr_400px] lg:gap-[72px] lg:py-[64px]">
        <div className="max-w-[575px] pt-1">
          <h1 className="max-w-[430px] text-[38px] font-semibold leading-[1.03] tracking-[-0.04em] text-[#1F1A26] sm:text-[48px] lg:text-[58px]">
            ¡Aprender a programar jugando!
          </h1>

          <p className="mt-[22px] max-w-[560px] text-[16px] leading-[1.9] text-[#6F687B] sm:text-[17px]">
            Desarrolla el pensamiento computacional mientras exploras mundos mágicos. Una plataforma
            diseñada para que los niños y jóvenes descubran el poder del código de forma divertida y
            segura.
          </p>

          <a
            href="#"
            className="mt-[28px] inline-flex items-center gap-3 text-[15px] font-medium text-[#2A2434]"
          >
            <span>Inicia tu aventura</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="flex justify-center lg:relative lg:left-[-170px] lg:justify-center">
          <ImagePlaceholder className="h-[320px] w-full max-w-[400px] rounded-[2px] sm:h-[380px] lg:h-[460px] lg:w-[500px] lg:max-w-[500px]" />
        </div>
      </SectionContainer>
    </section>
  );
};
