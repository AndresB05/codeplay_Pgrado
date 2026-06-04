import { SectionContainer } from './shared';

export const Footer = () => {
  return (
    <footer className="border-t border-[#E5DFF0] bg-[#F6F3FA]">
      <SectionContainer className="flex min-h-[58px] flex-col gap-3 py-4 text-[13px] text-[#6F687C] md:flex-row md:items-center md:justify-between md:py-0">
        <div className="font-semibold text-[#7C3AED]">Codeplay</div>

        <div className="text-center">
          © 2024 Codeplay - Acompañando el pensamiento computacional
        </div>

        <div className="flex items-center gap-5">
          <a href="#">Privacidad</a>
          <a href="#">Términos</a>
          <a href="#">Contacto</a>
          <a href="#">Ayuda</a>
        </div>
      </SectionContainer>
    </footer>
  );
};
