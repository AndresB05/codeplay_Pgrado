import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import tutorLeopard from '../../assets/brand/tutor-leopard.webp';
import { LeafCorner } from '../decor/JungleDecor';
import { CheckBullet, InfoBadge, SectionContainer } from './shared';

export const TutorSection = () => {
  return (
    <section id="tutores" className="jungle-surface scroll-mt-[100px]">
      <SectionContainer className="py-[40px] sm:py-[54px]">
        <div className="card relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:px-[48px] lg:py-[42px]">
          <LeafCorner className="-right-4 -top-4 rotate-[12deg]" />

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[300px_1fr] lg:gap-[74px]">
            <div className="flex justify-center">
              <img
                src={tutorLeopard}
                alt=""
                width={280}
                height={280}
                className="h-auto w-[240px] sm:w-[280px]"
              />
            </div>

            <div className="max-w-[620px]">
              <InfoBadge>Para Padres y Educadores</InfoBadge>

              <h2 className="title-lg mt-5 text-[28px] sm:text-[30px]">
                Monitorea su progreso fácilmente
              </h2>

              <p className="mt-5 text-[16px] font-semibold leading-[1.7] text-ink-soft">
                CodePlay no solo es divertido para los estudiantes, sino que proporciona
                herramientas robustas para tutores. Sigue el avance, identifica áreas de mejora y
                celebra los logros en el pensamiento computacional.
              </p>

              <ul className="mt-5 space-y-3">
                <li className="flex items-start gap-3 text-[16px] font-bold text-ink">
                  <CheckBullet />
                  <span>Seguimiento nivel a nivel: marcas, intentos y pasos.</span>
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
