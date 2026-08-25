import type { ReactNode } from 'react';

export type RoleCardTone = 'grape' | 'mint';

type SignupRoleCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  /** Texto del hueco reservado para la ilustración de la mascota. */
  placeholderLabel: string;
  tone: RoleCardTone;
  onSelect: () => void;
  decor?: ReactNode;
};

const TONE_STYLES: Record<RoleCardTone, { gradient: string; button: string; chip: string }> = {
  grape: {
    gradient: 'linear-gradient(135deg, #A77BF3 0%, #7B3FE4 100%)',
    button: 'btn-sun',
    chip: 'chip-grape',
  },
  mint: {
    gradient: 'linear-gradient(135deg, #7CE6DA 0%, #17C3B2 100%)',
    button: 'btn-mint',
    chip: 'chip-mint',
  },
};

export const SignupRoleCard = ({
  title,
  description,
  buttonLabel,
  placeholderLabel,
  tone,
  onSelect,
  decor,
}: SignupRoleCardProps) => {
  const styles = TONE_STYLES[tone];

  return (
    <article className="card overflow-hidden">
      {/*
       * Hueco reservado para la ilustración del rol. Se mantiene intacto: la
       * mascota entrará aquí cuando esté dibujada.
       */}
      <div
        className="relative flex h-[180px] w-full items-center justify-center border-b-[3px] border-ink"
        style={{ background: styles.gradient }}
      >
        <span className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/20" />
        {decor}

        <div className="relative flex h-[124px] w-[70%] items-center justify-center rounded-[18px] border-[3px] border-dashed border-white/70 bg-white/25 font-display text-[14px] text-white">
          {placeholderLabel}
        </div>
      </div>

      <div className="px-8 pb-8 pt-6 text-center">
        <span className={`chip ${styles.chip}`}>{title}</span>

        <p className="mx-auto mt-4 max-w-[300px] text-[15px] font-semibold leading-[1.7] text-ink-soft">
          {description}
        </p>

        <button type="button" onClick={onSelect} className={`btn ${styles.button} mt-7 w-full`}>
          {buttonLabel}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
};
