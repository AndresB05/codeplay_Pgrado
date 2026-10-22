import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { SectionContainer } from './shared';
import { BrandLogo } from '../ui/BrandLogo';

export const Footer = () => {
  return (
    <footer className="border-t-[3px] border-ink bg-white">
      <SectionContainer className="flex flex-col gap-3 py-5 text-[14px] font-bold text-ink-soft md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 font-display text-[20px] text-grape-dark">
          <BrandLogo size={38} />
          CodePlay
        </div>

        <div className="flex flex-col items-center gap-1 text-center md:items-end md:text-right">
          <nav aria-label="Textos legales" className="flex gap-4">
            <Link to={ROUTES.TERMS} className="text-grape-dark underline-offset-4 hover:underline">
              Términos y condiciones
            </Link>
            <Link to={ROUTES.PRIVACY} className="text-grape-dark underline-offset-4 hover:underline">
              Política de privacidad
            </Link>
          </nav>
          <span>© 2026 CodePlay · Acompañando el pensamiento computacional</span>
        </div>
      </SectionContainer>
    </footer>
  );
};
