import { CheckBullet, ImagePlaceholder, InfoBadge, SectionContainer } from './shared';

export const TutorSection = () => {
  return (
    <section id="tutores" className="scroll-mt-[88px] bg-[#F6F3FA]">
      <SectionContainer className="py-[40px] sm:py-[54px]">
        <div className="rounded-[18px] border border-dashed border-[#D6CCE5] bg-[#ECE7F8] px-6 py-8 sm:px-10 sm:py-10 lg:px-[48px] lg:py-[42px]">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[300px_1fr] lg:gap-[74px]">
            <div className="flex justify-center">
              <div className="flex h-[184px] w-[184px] items-center justify-center rounded-full bg-[#E5D8FB]">
                <ImagePlaceholder
                  rounded="rounded-full"
                  className="h-[128px] w-[128px] border-[#DCD3E8]"
                />
              </div>
            </div>

            <div className="max-w-[620px]">
              <InfoBadge>Para Padres y Educadores</InfoBadge>

              <h2 className="mt-5 text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#23202C] sm:text-[30px]">
                Monitorea su progreso fácilmente
              </h2>

              <p className="mt-5 text-[15px] leading-[1.9] text-[#6F687C]">
                Codeplay no solo es divertido para los estudiantes, sino que proporciona
                herramientas robustas para tutores. Sigue el avance, identifica áreas de mejora y
                celebra los logros en el pensamiento computacional.
              </p>

              <ul className="mt-5 space-y-3">
                <li className="flex items-start gap-3 text-[15px] text-[#655E73]">
                  <CheckBullet />
                  <span>Reportes detallados de habilidades.</span>
                </li>
                <li className="flex items-start gap-3 text-[15px] text-[#655E73]">
                  <CheckBullet />
                  <span>Asignación de misiones personalizadas.</span>
                </li>
              </ul>

              <a href="#" className="mt-6 inline-block text-[14px] font-medium text-[#23202C]">
                Descubre el Panel de Tutor
              </a>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
};
