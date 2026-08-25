import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { LeafCorner, TropicalFlower } from '../decor/JungleDecor';
import { CheckBullet, ImagePlaceholder, InfoBadge, SectionContainer } from './shared';

export const TutorSection = () => {
  return (
    <section id="tutores" className="jungle-surface scroll-mt-[100px]">
      <SectionContainer className="py-[40px] sm:py-[54px]">
        <div className="card relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:px-[48px] lg:py-[42px]">
          <LeafCorner className="-right-4 -top-4 rotate-[12deg]" />

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[300px_1fr] lg:gap-[74px]">
            <div className="flex justify-center">
              <div className="relative flex h-[184px] w-[184px] items-center justify-center rounded-full border-[3px] border-ink bg-[linear-gradient(135deg,#7CE6DA_0%,#17C3B2_100%)] shadow-[0_8px_0_rgba(42,27,69,0.16)]">
                <TropicalFlower
                  size={40}
                  className="absolute -left-3 top-4 rotate-[-12deg]"
                  color="#FFC93C"
                />

                {/* Hueco de la mascota guía: se conserva a la espera de la ilustración. */}
                <ImagePlaceholder
                  rounded="rounded-full"
                  className="h-[128px] w-[128px] border-white/70"
                />
              </div>
            </div>

            <div className="max-w-[620px]">
              <InfoBadge>Para Padres y Educadores</InfoBadge>

              <h2 className="title-lg mt-5 text-[28px] sm:text-[30px]">
                Monitorea su progreso fácilmente
              </h2>

              <p className="mt-5 text-[16px] font-semibold leading-[1.7] text-ink-soft">
                Codeplay no solo es divertido para los estudiantes, sino que proporciona
                herramientas robustas para tutores. Sigue el avance, identifica áreas de mejora y
                celebra los logros en el pensamiento computacional.
              </p>

              <ul className="mt-5 space-y-3">
                <li className="flex items-start gap-3 text-[16px] font-bold text-ink">
                  <CheckBullet />
                  <span>Reportes detallados de habilidades.</span>
                </li>
                <li className="flex items-start gap-3 text-[16px] font-bold text-ink">
                  <CheckBullet />
                  <span>Asignación de misiones personalizadas.</span>
                </li>
              </ul>

              <Link to={ROUTES.SIGNUP} className="btn btn-mint mt-7">
                Descubre el Panel de Tutor
              </Link>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
};
