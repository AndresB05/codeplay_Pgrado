import type { ReactNode } from 'react';

export type StatTone = 'grape' | 'mint' | 'sun' | 'sky' | 'coral';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  tone: StatTone;
}

const TONE_STYLES: Record<StatTone, { bubble: string; value: string }> = {
  grape: { bubble: 'bg-grape-soft', value: 'text-grape-dark' },
  mint: { bubble: 'bg-mint-soft', value: 'text-mint-dark' },
  sun: { bubble: 'bg-sun-soft', value: 'text-sun-dark' },
  sky: { bubble: 'bg-sky-soft', value: 'text-sky-dark' },
  coral: { bubble: 'bg-coral-soft', value: 'text-coral-dark' },
};

export const StatCard = ({ icon, title, value, tone }: StatCardProps) => {
  const styles = TONE_STYLES[tone];

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
