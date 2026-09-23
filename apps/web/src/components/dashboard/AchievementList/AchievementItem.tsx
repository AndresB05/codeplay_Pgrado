import type { CatalogAchievement } from '../../../services/achievements.service';

interface AchievementItemProps {
  achievement: CatalogAchievement;
}

const formatUnlockedAt = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

/*
 * Un dibujo por familia de logro. El catálogo guarda un nombre de icono y no un
 * emoji porque la base no decide cómo se ve nada; el que no reconozcamos sale
 * con el trofeo, que es lo que era todo hasta el paso 22.
 */
const ICONS: Record<string, string> = {
  medal: '🏅',
  crown: '👑',
  trophy: '🏆',
  compass: '🧭',
  wing: '🪽',
  maze: '🌀',
  bandage: '🩹',
  flame: '🔥',
};

export const AchievementItem = ({ achievement }: AchievementItemProps) => {
  const unlocked = achievement.unlockedAt !== null;

  return (
    <article className={`wood-board wood-plank px-1 py-1 ${unlocked ? '' : 'wood-plank-locked'}`}>
      <div className="flex items-center gap-3">
        <span
          className="wood-well flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[16px] text-[24px]"
          aria-hidden="true"
        >
          {ICONS[achievement.iconName] ?? ICONS.trophy}
        </span>

        <div className="wood-bare min-w-0 flex-1 rounded-[12px] px-3 py-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="wood-deep font-display text-[19px] leading-tight">{achievement.title}</h4>

            {/*
             * Las palabras distinguen los dos estados, no sólo el gris: para
             * quien no lo distinga, «Desbloqueado» y «Por conseguir» son lo
             * único que queda.
             */}
            <span className="chip wood-well wood-carved py-0.5">
              {unlocked ? '✨ Desbloqueado' : 'Por conseguir'}
            </span>
          </div>

          <p className="wood-deep mt-0.5 text-[15px] font-semibold leading-[1.35]">
            {achievement.description}
          </p>

          <p className="wood-deep mt-1 text-[13px] font-bold uppercase tracking-[0.04em]">
            {achievement.unlockedAt === null
              ? `+${achievement.awardedXp} XP`
              : `${formatUnlockedAt(achievement.unlockedAt)} · +${achievement.awardedXp} XP`}
          </p>
        </div>
      </div>
    </article>
  );
};
