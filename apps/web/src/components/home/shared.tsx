import React from 'react';

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export const SectionContainer = ({ children, className = '' }: ContainerProps) => {
  return (
    <div className={`mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-4 ${className}`}>
      {children}
    </div>
  );
};

type PlaceholderProps = {
  className?: string;
  rounded?: string;
};

/**
 * Hueco reservado para la ilustración de la mascota. Se deja vacío a propósito:
 * el contorno discontinuo indica que ahí entrará una imagen todavía en camino.
 */
export const ImagePlaceholder = ({
  className = '',
  rounded = 'rounded-[18px]',
}: PlaceholderProps) => {
  return (
    <div
      aria-label="placeholder"
      className={`border-[3px] border-dashed border-line bg-cream ${rounded} ${className}`}
    />
  );
};

export const LevelBadge = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex h-[30px] items-center rounded-full border-2 border-ink bg-sun px-3 font-display text-[13px] leading-none text-ink shadow-[0_3px_0_rgba(42,27,69,0.25)]">
      {children}
    </span>
  );
};

export const InfoBadge = ({ children }: { children: React.ReactNode }) => {
  return <span className="chip chip-leaf">{children}</span>;
};

/** Viñeta en forma de hoja: la lista de ventajas del tutor brota de la liana. */
export const CheckBullet = () => {
  return (
    <span
      className="mt-[3px] inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-ink bg-jungle"
      aria-hidden="true"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 12.5L10 17.5L19 7"
          stroke="#FFF9EF"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
