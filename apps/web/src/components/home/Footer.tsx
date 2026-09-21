import { SectionContainer } from './shared';
import { BrandLogo } from '../ui/BrandLogo';

export const Footer = () => {
  return (
    <footer className="border-t-[3px] border-ink bg-white">
      <SectionContainer className="flex flex-col gap-3 py-5 text-[14px] font-bold text-ink-soft md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 font-display text-[20px] text-grape-dark">
          <BrandLogo size={38} />
          Codeplay
        </div>

        <div className="text-center">
          © 2026 Codeplay · Acompañando el pensamiento computacional
        </div>
      </SectionContainer>
    </footer>
  );
};
