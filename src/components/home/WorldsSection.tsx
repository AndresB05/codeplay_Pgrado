import { ImagePlaceholder, LevelBadge, SectionContainer } from './shared';

const BigWorldCard = () => {
  return (
    <article className="overflow-hidden rounded-[14px] border border-[#E4DDF0] bg-white shadow-[0_4px_18px_rgba(109,40,217,0.08)]">
      <div className="relative">
        <ImagePlaceholder rounded="rounded-none" className="h-[200px] w-full sm:h-[255px]" />
        <div className="absolute right-3 top-3">
          <LevelBadge>Nivel 1</LevelBadge>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <h3 className="text-[17px] font-semibold text-[#23202C] sm:text-[18px]">
          La Selva de las Secuencias
        </h3>
        <p className="mt-2 text-[14px] leading-[1.7] text-[#726B7D] sm:text-[15px]">
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
};

const SmallWorldCard = ({ title, description, level }: SmallWorldCardProps) => {
  return (
    <article className="overflow-hidden rounded-[14px] border border-[#E4DDF0] bg-white shadow-[0_4px_18px_rgba(109,40,217,0.08)]">
      <div className="relative">
        <ImagePlaceholder rounded="rounded-none" className="h-[120px] w-full" />
        <div className="absolute right-3 top-3">
          <LevelBadge>{level}</LevelBadge>
        </div>
      </div>

      <div className="px-4 py-4">
        <h3 className="text-[16px] font-semibold text-[#23202C] sm:text-[17px]">{title}</h3>
        <p className="mt-1 text-[13px] leading-[1.6] text-[#726B7D]">{description}</p>
      </div>
    </article>
  );
};

export const WorldsSection = () => {
  return (
    <section className="bg-[#F0ECF8]">
      <SectionContainer className="py-[42px] sm:py-[50px] lg:py-[44px]">
        <div className="text-center">
          <h2 className="text-[29px] font-semibold tracking-[-0.03em] text-[#7C3AED] sm:text-[32px]">
            Explora mundos mágicos
          </h2>
          <p className="mx-auto mt-[10px] max-w-[760px] text-[14px] text-[#716A7A] sm:text-[15px]">
            ¡Cada mundo es una nueva aventura donde aprenderás conceptos increíbles!
          </p>
        </div>

        <div className="mt-[34px] grid grid-cols-1 gap-4 lg:grid-cols-[2fr_0.96fr]">
          <BigWorldCard />

          <div className="grid grid-cols-1 gap-4">
            <SmallWorldCard
              title="El Espacio de los Bucles"
              description="Automatiza tareas repitiendo acciones."
              level="Nivel 2"
            />
            <SmallWorldCard
              title="El Océano Condicional"
              description="Toma decisiones basadas en el entorno."
              level="Nivel 3"
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  );
};
