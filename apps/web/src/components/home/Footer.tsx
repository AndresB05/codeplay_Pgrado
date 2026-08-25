import { VineDivider } from '../decor/JungleDecor';
import { SectionContainer } from './shared';

const footerLinks = ['Privacidad', 'Términos', 'Contacto', 'Ayuda'];

export const Footer = () => {
  return (
    <footer className="border-t-[3px] border-ink bg-white">
      <VineDivider className="-mt-[13px]" />

      <SectionContainer className="flex flex-col gap-3 py-5 text-[14px] font-bold text-ink-soft md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 font-display text-[20px] text-grape-dark">
          <span className="flex h-[32px] w-[32px] items-center justify-center rounded-[11px] border-[3px] border-ink bg-sun">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 8L5 12L9 16M15 8L19 12L15 16"
                stroke="#2A1B45"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Codeplay
        </div>

        <div className="text-center">
          © 2024 Codeplay · Acompañando el pensamiento computacional
        </div>

        <div className="flex items-center gap-5">
          {footerLinks.map((label) => (
            <a key={label} href="#" className="hover:text-grape-dark">
              {label}
            </a>
          ))}
        </div>
      </SectionContainer>
    </footer>
  );
};
