import type { UnlockedAchievement } from '../../../services/achievements.service';

interface AchievementItemProps {
  achievement: UnlockedAchievement;
}

const formatUnlockedAt = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

export const AchievementItem = ({ achievement }: AchievementItemProps) => {
  return (
    <article className="card px-5 py-5">
      <div className="flex items-start gap-4">
        <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[20px] border-[3px] border-ink bg-sun text-[28px]">
          {achievement.iconName}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-[19px] leading-tight text-ink">{achievement.title}</h4>
            <span className="chip chip-mint">✨ Desbloqueado</span>
          </div>

          <p className="mt-1 text-[15px] font-semibold leading-[1.6] text-ink-soft">
            {achievement.description}
          </p>

          <p className="mt-3 text-[13px] font-bold uppercase tracking-[0.04em] text-ink-faint">
            {formatUnlockedAt(achievement.unlockedAt)} · +{achievement.awardedXp} XP
          </p>
        </div>
      </div>
    </article>
  );
};
