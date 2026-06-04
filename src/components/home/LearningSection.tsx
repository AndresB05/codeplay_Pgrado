import { SectionContainer } from './shared';

type LearningItemProps = {
  title: string;
  description: string;
  color: string;
};

const LearningItem = ({ title, description, color }: LearningItemProps) => {
  return (
    <article className="flex flex-col items-center text-center">
      <div className={`h-[58px] w-[58px] rounded-full ${color} sm:h-[62px] sm:w-[62px]`} />
      <h3 className="mt-6 text-[18px] font-semibold text-[#23202C]">{title}</h3>
      <p className="mt-3 max-w-[260px] text-[15px] leading-[1.8] text-[#726B7C]">{description}</p>
    </article>
  );
};

export const LearningSection = () => {
  return (
    <section id="como-aprender" className="scroll-mt-[88px] bg-[#F6F3FA]">
      <SectionContainer className="py-[58px] sm:py-[72px] lg:py-[78px]">
        <h2 className="text-center text-[30px] font-semibold tracking-[-0.03em] text-[#7C3AED]">
          ¿Cómo aprender?
        </h2>

        <div className="mt-[42px] grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          <LearningItem
            color="bg-[#8B5CF6]"
            title="Bloques Lógicos"
            description="Arrastra y suelta bloques coloridos para construir soluciones sin miedo a errores de sintaxis."
          />
          <LearningItem
            color="bg-[#F4B547]"
            title="Resuelve Retos"
            description="Enfrenta divertidos rompecabezas que desarrollan la abstracción y el reconocimiento de patrones."
          />
          <LearningItem
            color="bg-[#0C9488]"
            title="Gana Recompensas"
            description="Colecciona insignias y personaliza tu explorador mientras avanzas en tu viaje de aprendizaje."
          />
        </div>
      </SectionContainer>
    </section>
  );
};
