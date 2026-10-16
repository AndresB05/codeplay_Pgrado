import learnBlocks from '../../assets/brand/learn-blocks.webp';
import learnChallenges from '../../assets/brand/learn-challenges.webp';
import learnRewards from '../../assets/brand/learn-rewards.webp';
import { SectionContainer } from './shared';

type LearningItemProps = {
  title: string;
  description: string;
  image: string;
  /** Sólo donde Leo está cortado de medio cuerpo; los bloques ya cierran la imagen. */
  fade?: boolean;
};

const LearningItem = ({ title, description, image, fade = false }: LearningItemProps) => {
  return (
    <article className="card-flat flex flex-col items-center px-5 py-6 text-center">
      {/*
       * Donde Leo es de medio cuerpo, el corte de abajo se funde con la tarjeta
       * en lugar de quedar como una línea recta.
       */}
      <img
        src={image}
        alt=""
        aria-hidden
        className={`h-[170px] w-auto ${
          fade ? '[mask-image:linear-gradient(to_bottom,black_78%,transparent)]' : ''
        }`}
      />

      <h3 className="mt-2 font-display text-[20px] text-ink">{title}</h3>
      <p className="mt-3 max-w-[280px] text-[15px] font-semibold leading-[1.7] text-ink-soft">
        {description}
      </p>
    </article>
  );
};

export const LearningSection = () => {
  return (
    <section id="como-aprender" className="jungle-surface scroll-mt-[100px]">
      <SectionContainer className="py-[58px] sm:py-[72px] lg:py-[78px]">
        <h2 className="title-xl text-center">¿Cómo aprender?</h2>
        <p className="subtitle mx-auto mt-2 max-w-[640px] text-center">
          Tres pasos para cruzar la selva del código sin perderte.
        </p>

        <div className="mt-[42px] grid grid-cols-1 gap-6 md:grid-cols-3">
          <LearningItem
            image={learnBlocks}
            title="Bloques Lógicos"
            description="Arrastra y suelta bloques coloridos para construir soluciones sin miedo a errores de sintaxis."
          />
          <LearningItem
            image={learnChallenges}
            fade
            title="Resuelve Retos"
            description="Enfrenta divertidos rompecabezas que desarrollan la abstracción y el reconocimiento de patrones."
          />
          <LearningItem
            image={learnRewards}
            fade
            title="Gana Recompensas"
            description="Gana trofeos y sube de Nivel Explorador mientras avanzas en tu viaje de aprendizaje."
          />
        </div>
      </SectionContainer>
    </section>
  );
};
