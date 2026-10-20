import type { ReactNode } from 'react';
import { TILT_ON_HOVER, pickTilt } from './pickTilt';

export type StatTone = 'grape' | 'mint' | 'sun' | 'sky' | 'coral';

interface StatCardProps {
  /** La celda del tutor no lleva icono ni color: lo que se lee es la cifra. */
  icon?: ReactNode;
  title: string;
  value: string;
  tone?: StatTone;
  /**
   * `map`: sobre el pergamino de las misiones y escrita como en él.
   * `tutor`: una celda de la franja `tutor-stats`; la franja la pone quien la monta.
   */
  variant?: 'card' | 'map' | 'tutor';
}

/* «3 de 4»: el total va más pequeño para que la cifra que importa se lea primero. */
const FRACTION = /^(\d+) (de \d+.*)$/;

const TONE_STYLES: Record<StatTone, { bubble: string; value: string; stamp: string }> = {
  grape: { bubble: 'bg-grape-soft', value: 'text-grape-dark', stamp: 'border-grape-dark' },
  mint: { bubble: 'bg-mint-soft', value: 'text-mint-dark', stamp: 'border-mint-dark' },
  sun: { bubble: 'bg-sun-soft', value: 'text-sun-dark', stamp: 'border-sun-dark' },
  sky: { bubble: 'bg-sky-soft', value: 'text-sky-dark', stamp: 'border-sky-dark' },
  coral: { bubble: 'bg-coral-soft', value: 'text-coral-dark', stamp: 'border-coral-dark' },
};

export const StatCard = ({
  icon,
  title,
  value,
  tone = 'grape',
  variant = 'card',
}: StatCardProps) => {
  const styles = TONE_STYLES[tone];

  if (variant === 'tutor') {
    const fraction = value.match(FRACTION);

    return (
      <div>
        <dt className="text-[13.5px] font-medium text-tutor-ink-soft">{title}</dt>
        {/* Un nombre, como el del mundo más común, baja de tamaño para caber en una línea. */}
        <dd
          className={`mt-0.5 font-bold leading-tight text-tutor-ink ${
            /^\d/.test(value) ? 'text-[22px]' : 'text-[17px]'
          }`}
        >
          {fraction ? (
            <>
              {fraction[1]}{' '}
              <span className="text-[14px] font-medium text-tutor-ink-soft">{fraction[2]}</span>
            </>
          ) : (
            value
          )}
        </dd>
      </div>
    );
  }

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
