import { MonsteraLeaf, PalmFrond } from '../decor/JungleDecor';
import { ImagePlaceholder, LevelBadge, SectionContainer } from './shared';

const BigWorldCard = () => {
  return (
    <article className="card flex flex-col overflow-hidden">
      {/*
       * La rejilla estira la tarjeta hasta la altura de la columna de al lado; el
       * hueco de la imagen crece para ocuparla y no deja una franja en blanco.
       */}
      <div className="relative flex flex-1 flex-col">
        {/* Hueco reservado para la ilustración del mundo. */}
        <ImagePlaceholder
          rounded="rounded-none"
          className="min-h-[200px] w-full flex-1 sm:min-h-[255px]"
        />

        <MonsteraLeaf
          size={78}
          className="pointer-events-none absolute -left-5 -top-5 rotate-[26deg]"
        />

        <div className="absolute right-3 top-3">
          <LevelBadge>Mundo 1</LevelBadge>
        </div>
      </div>

      <div
        className="border-t-[3px] border-ink px-5 py-5 sm:px-6 sm:py-6"
        style={{ background: 'linear-gradient(135deg, #7CE6DA 0%, #17C3B2 100%)' }}
      >
        <h3 className="font-display text-[22px] leading-tight text-white drop-shadow-[0_2px_0_rgba(42,27,69,0.35)] sm:text-[24px]">
          Sendero de los Patrones
        </h3>
        <p className="mt-2 text-[15px] font-bold leading-[1.6] text-white/95">
          Ordena los pasos del explorador y encuentra el patrón que resuelve cada tablero: avanzar y
          girar hasta la meta.
        </p>
      </div>
    </article>
  );
};

type SmallWorldCardProps = {
  title: string;
  description: string;
  level: string;
  gradient: string;
};

const SmallWorldCard = ({ title, description, level, gradient }: SmallWorldCardProps) => {
  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="relative flex flex-1 flex-col">
        <ImagePlaceholder rounded="rounded-none" className="min-h-[120px] w-full flex-1" />

        <div className="absolute right-3 top-3">
          <LevelBadge>{level}</LevelBadge>
        </div>
      </div>

      <div className="border-t-[3px] border-ink px-4 py-4" style={{ background: gradient }}>
        <h3 className="font-display text-[18px] leading-tight text-white drop-shadow-[0_2px_0_rgba(42,27,69,0.35)]">
          {title}
        </h3>
        <p className="mt-1 text-[14px] font-bold leading-[1.5] text-white/95">{description}</p>
      </div>
    </article>
  );
};

export const WorldsSection = () => {
  return (
    <section
      id="mundos"
      className="jungle-band relative scroll-mt-[100px] overflow-hidden border-y-[3px] border-ink"
    >
      <PalmFrond
        size={130}
        className="pointer-events-none absolute -left-10 top-6 rotate-[14deg] opacity-70"
      />
      <PalmFrond
        size={130}
        className="pointer-events-none absolute -right-10 bottom-6 -scale-x-100 rotate-[14deg] opacity-70"
        color="#1F9D5B"
      />

      <SectionContainer className="relative z-10 py-[42px] sm:py-[50px] lg:py-[56px]">
        <div className="text-center">
          <h2 className="title-xl">Explora mundos mágicos</h2>
          <p className="subtitle mx-auto mt-[10px] max-w-[760px]">
            ¡Cada mundo es una nueva aventura donde aprenderás conceptos increíbles!
          </p>
        </div>

        <div className="mt-[34px] grid grid-cols-1 gap-6 lg:grid-cols-[2fr_0.96fr]">
          <BigWorldCard />

          <div className="grid grid-cols-1 gap-6">
            <SmallWorldCard
              title="Cordillera de la Abstracción"
              description="Parte el camino en tramos y súbelo por partes."
              level="Mundo 2"
              gradient="linear-gradient(135deg, #A77BF3 0%, #7B3FE4 100%)"
            />
            <SmallWorldCard
              title="Encrucijada de las Decisiones"
              description="Varios caminos llegan, pero sólo algunos caben en tus pasos."
              level="Mundo 3"
              gradient="linear-gradient(135deg, #7FC4FF 0%, #3B9DF8 100%)"
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  );
};
