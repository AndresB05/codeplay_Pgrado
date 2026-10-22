import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '../../components/home/Footer';
import { SectionContainer } from '../../components/home/shared';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { ROUTES } from '../../constants/routes';
import type { LegalDocument } from './legalContent';

const Lead = ({ children }: { children?: string }) =>
  children ? <strong className="font-bold text-ink">{children} </strong> : null;

export const LegalPage = ({ document: legal }: { document: LegalDocument }) => {
  /*
   * Se llega desde el pie de la portada: sin esto la página abriría por el
   * final. `instant` porque el `html` tiene desplazamiento suave y se vería
   * subir el texto entero.
   */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [legal]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <header className="border-b-[3px] border-ink bg-white">
        <SectionContainer className="flex h-[84px] items-center justify-between gap-4">
          <Link
            to={ROUTES.LANDING}
            className="flex items-center gap-2 font-display text-[26px] tracking-[-0.02em] text-grape-dark sm:text-[32px]"
          >
            <BrandLogo size={52} />
            CodePlay
          </Link>
          <Link to={ROUTES.LANDING} className="btn btn-sm btn-ghost">
            Volver al inicio
          </Link>
        </SectionContainer>
      </header>

      <main className="flex-1 py-10">
        <article className="mx-auto w-full max-w-[760px] px-4 text-[16px] leading-relaxed text-ink-soft">
          <h1 className="font-display text-[32px] leading-tight text-grape-dark sm:text-[40px]">
            {legal.title}
          </h1>

          {legal.sections.map((section) => (
            <section key={section.heading} className="mt-8">
              <h2 className="font-display text-[22px] text-ink">{section.heading}</h2>
              {section.blocks.map((block, index) =>
                block.kind === 'paragraph' ? (
                  <p key={index} className="mt-3">
                    <Lead>{block.lead}</Lead>
                    {block.text}
                  </p>
                ) : (
                  <ul key={index} className="mt-3 list-disc space-y-2 pl-6">
                    {block.items.map((item) => (
                      <li key={item.text}>
                        <Lead>{item.lead}</Lead>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </section>
          ))}
        </article>
      </main>

      <Footer />
    </div>
  );
};
