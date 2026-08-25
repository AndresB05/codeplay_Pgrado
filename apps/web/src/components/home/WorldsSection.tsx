import { MonsteraLeaf, PalmFrond } from '../decor/JungleDecor';
import { ImagePlaceholder, LevelBadge, SectionContainer } from './shared';

const BigWorldCard = () => {
  return (
    <article className="card overflow-hidden">
      <div className="relative">
        {/* Hueco reservado para la ilustración del mundo. */}
        <ImagePlaceholder rounded="rounded-none" className="h-[200px] w-full sm:h-[255px]" />

        <MonsteraLeaf
          size={78}
          className="pointer-events-none absolute -left-5 -top-5 rotate-[26deg]"
        />

        <div className="absolute right-3 top-3">
          <LevelBadge>Nivel 1</LevelBadge>
        </div>
      </div>

      <div
        className="border-t-[3px] border-ink px-5 py-5 sm:px-6 sm:py-6"
        style={{ background: 'linear-gradient(135deg, #7CE6DA 0%, #17C3B2 100%)' }}
      >
        <h3 className="font-display text-[22px] leading-tight text-white drop-shadow-[0_2px_0_rgba(42,27,69,0.35)] sm:text-[24px]">
          La Selva de las Secuencias
        </h3>
        <p className="mt-2 text-[15px] font-bold leading-[1.6] text-white/95">
          Aprende los fundamentos ordenando los pasos para guiar a nuestro leopardo a través del
          espeso bosque.
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
    <article className="card overflow-hidden">
      <div className="relative">
        <ImagePlaceholder rounded="rounded-none" className="h-[120px] w-full" />

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
    <section className="jungle-band relative overflow-hidden border-y-[3px] border-ink">
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
              title="El Espacio de los Bucles"
              description="Automatiza tareas repitiendo acciones."
              level="Nivel 2"
              gradient="linear-gradient(135deg, #A77BF3 0%, #7B3FE4 100%)"
            />
            <SmallWorldCard
              title="El Océano Condicional"
              description="Toma decisiones basadas en el entorno."
              level="Nivel 3"
              gradient="linear-gradient(135deg, #7FC4FF 0%, #3B9DF8 100%)"
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  );
};
