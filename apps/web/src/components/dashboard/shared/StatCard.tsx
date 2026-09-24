import type { ReactNode } from 'react';
import { TILT_ON_HOVER, pickTilt } from './pickTilt';

export type StatTone = 'grape' | 'mint' | 'sun' | 'sky' | 'coral';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  tone: StatTone;
  /** `map`: sobre el pergamino de las misiones y escrita como en él. */
  variant?: 'card' | 'map';
}

const TONE_STYLES: Record<StatTone, { bubble: string; value: string; stamp: string }> = {
  grape: { bubble: 'bg-grape-soft', value: 'text-grape-dark', stamp: 'border-grape-dark' },
  mint: { bubble: 'bg-mint-soft', value: 'text-mint-dark', stamp: 'border-mint-dark' },
  sun: { bubble: 'bg-sun-soft', value: 'text-sun-dark', stamp: 'border-sun-dark' },
  sky: { bubble: 'bg-sky-soft', value: 'text-sky-dark', stamp: 'border-sky-dark' },
  coral: { bubble: 'bg-coral-soft', value: 'text-coral-dark', stamp: 'border-coral-dark' },
};

export const StatCard = ({ icon, title, value, tone, variant = 'card' }: StatCardProps) => {
  const styles = TONE_STYLES[tone];

  /*
   * El dato escrito a mano en tinta café y el icono en un sello de tinta, como
   * las misiones: el color de la tarjeta sobrevive sólo en el sello.
   */
  if (variant === 'map') {
    return (
      <article
        onMouseEnter={pickTilt}
        className={`relative isolate flex flex-col justify-center px-12 pb-9 pt-8 ${TILT_ON_HOVER}`}
      >
        <div aria-hidden className="map-sheet pointer-events-none absolute inset-0 -z-10" />

        {/* Centrado en alto: al lado de una cifra de dos líneas la tarjeta se estira. */}
        <div className="flex items-center gap-4">
          <div
            className={`flex h-[54px] w-[54px] shrink-0 -rotate-[4deg] items-center justify-center rounded-full border-[3px] border-dashed ${styles.stamp}`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <p className="font-map text-[16px] font-normal leading-tight text-sepia-soft">
              {title}
            </p>
            <p className="font-map text-[28px] font-normal leading-tight text-sepia">{value}</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="card px-5 py-4">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[18px] border-[3px] border-ink ${styles.bubble}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-faint">
            {title}
          </p>
          <p className={`mt-0.5 font-display text-[26px] leading-tight ${styles.value}`}>{value}</p>
        </div>
      </div>
    </article>
  );
};
