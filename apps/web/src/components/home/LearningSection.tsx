import type { ReactNode } from 'react';
import { MonsteraLeaf, Toucan, TropicalFlower } from '../decor/JungleDecor';
import { SectionContainer } from './shared';

type LearningItemProps = {
  title: string;
  description: string;
  bubble: string;
  icon: ReactNode;
};

const LearningItem = ({ title, description, bubble, icon }: LearningItemProps) => {
  return (
    <article className="card-flat flex flex-col items-center px-5 py-6 text-center">
      <div
        className={`flex h-[86px] w-[86px] items-center justify-center rounded-full border-[3px] border-ink shadow-[0_5px_0_rgba(42,27,69,0.18)] ${bubble}`}
      >
        {icon}
      </div>

      <h3 className="mt-5 font-display text-[20px] text-ink">{title}</h3>
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
            bubble="bg-grape-soft"
            icon={<MonsteraLeaf size={48} color="#7B3FE4" />}
            title="Bloques Lógicos"
            description="Arrastra y suelta bloques coloridos para construir soluciones sin miedo a errores de sintaxis."
          />
          <LearningItem
            bubble="bg-sun-soft"
            icon={<TropicalFlower size={48} color="#FF8A3D" />}
            title="Resuelve Retos"
            description="Enfrenta divertidos rompecabezas que desarrollan la abstracción y el reconocimiento de patrones."
          />
          <LearningItem
            bubble="bg-jungle-soft"
            icon={<Toucan size={52} />}
            title="Gana Recompensas"
            description="Colecciona insignias y personaliza tu explorador mientras avanzas en tu viaje de aprendizaje."
          />
        </div>
      </SectionContainer>
    </section>
  );
};
