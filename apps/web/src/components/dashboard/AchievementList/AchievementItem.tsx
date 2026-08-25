interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
}

interface AchievementItemProps {
  achievement: Achievement;
}

export const AchievementItem = ({ achievement }: AchievementItemProps) => {
  const progressPercentage =
    achievement.progress && achievement.target
      ? Math.round((achievement.progress / achievement.target) * 100)
      : 0;

  return (
    <article className={`card px-5 py-5 ${achievement.unlocked ? '' : 'opacity-75'}`}>
      <div className="flex items-start gap-4">
        <span
          className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[20px] border-[3px] border-ink text-[28px] ${
            achievement.unlocked ? 'bg-sun' : 'bg-cream'
          }`}
        >
          {achievement.icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-[19px] leading-tight text-ink">{achievement.name}</h4>

            {achievement.unlocked ? (
              <span className="chip chip-mint">✨ Desbloqueado</span>
            ) : (
              <span className="chip chip-grape">🔒 Bloqueado</span>
            )}
          </div>

          <p className="mt-1 text-[15px] font-semibold leading-[1.6] text-ink-soft">
            {achievement.description}
          </p>

          {!achievement.unlocked &&
          achievement.progress !== undefined &&
          achievement.target !== undefined ? (
            <>
              <div className="mt-4 h-[12px] w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
                <div
                  className="h-full rounded-full bg-jungle"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <p className="mt-2 text-[13px] font-bold uppercase tracking-[0.04em] text-ink-faint">
                {achievement.progress}/{achievement.target}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
};
