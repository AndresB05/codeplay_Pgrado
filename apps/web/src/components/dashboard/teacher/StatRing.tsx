type RingTone = 'accent' | 'info' | 'ok' | 'warn';

const TONES: Record<RingTone, string> = {
  accent: 'stroke-tutor-accent',
  info: 'stroke-tutor-info',
  ok: 'stroke-tutor-ok',
  warn: 'stroke-tutor-warn',
};

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/* «3 de 4»: el total va más pequeño para que la cifra que importa se lea primero. */
const FRACTION = /^(\d+) (de \d+.*)$/;

/**
 * Una cifra del panel con su anillo. El anillo es sólo para el ojo —`aria-hidden`,
 * con el porcentaje dentro—: lo que se lee, también en voz, es el valor en
 * texto, que es el mismo que antes.
 */
export const StatRing = ({
  title,
  value,
  ratio,
  tone,
}: {
  title: string;
  value: string;
  /** De 0 a 1. `null` cuando no hay con qué medir: el anillo sale vacío y sin cifra. */
  ratio: number | null;
  tone: RingTone;
}) => {
  const percent = ratio === null ? null : Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  const fraction = value.match(FRACTION);

  return (
    <div className="tutor-card flex items-center gap-3.5 px-4 py-3.5">
      <svg aria-hidden="true" width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
        <circle
          cx="28"
          cy="28"
          r={RADIUS}
          fill="none"
          strokeWidth="6"
          className="stroke-tutor-rule"
        />
        {percent === null ? null : (
          <circle
            cx="28"
            cy="28"
            r={RADIUS}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
            transform="rotate(-90 28 28)"
            className={TONES[tone]}
          />
        )}
        {percent === null ? null : (
          <text
            x="28"
            y="28"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-tutor-ink text-[11px] font-semibold"
          >
            {percent}%
          </text>
        )}
      </svg>

      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-tutor-ink-soft">{title}</p>
        <p className="mt-0.5 text-[22px] font-bold leading-tight text-tutor-ink">
          {fraction ? (
            <>
              {fraction[1]}{' '}
              <span className="text-[14px] font-medium text-tutor-ink-soft">{fraction[2]}</span>
            </>
          ) : (
            value
          )}
        </p>
      </div>
    </div>
  );
};
