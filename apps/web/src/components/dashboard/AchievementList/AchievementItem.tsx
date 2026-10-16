import bandageBadge from '../../../assets/brand/achievement-bandage.webp';
import compassBadge from '../../../assets/brand/achievement-compass.webp';
import crownBadge from '../../../assets/brand/achievement-crown.webp';
import flameBadge from '../../../assets/brand/achievement-flame.webp';
import mazeBadge from '../../../assets/brand/achievement-maze.webp';
import medalBadge from '../../../assets/brand/achievement-medal.webp';
import trophyBadge from '../../../assets/brand/achievement-trophy.webp';
import wingBadge from '../../../assets/brand/achievement-wing.webp';
import type { CatalogAchievement } from '../../../services/achievements.service';

interface AchievementItemProps {
  achievement: CatalogAchievement;
}

const formatUnlockedAt = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

/*
 * Una insignia por familia de logro. El catálogo guarda un nombre de icono y no
 * una imagen porque la base no decide cómo se ve nada; el que no reconozcamos sale
 * con el trofeo, que es lo que era todo hasta el paso 22.
 */
const ICONS: Record<string, string> = {
  medal: medalBadge,
  crown: crownBadge,
  trophy: trophyBadge,
  compass: compassBadge,
  wing: wingBadge,
  maze: mazeBadge,
  bandage: bandageBadge,
  flame: flameBadge,
};

export const AchievementItem = ({ achievement }: AchievementItemProps) => {
  const unlocked = achievement.unlockedAt !== null;

  return (
    <article className={`wood-board wood-plank px-1 py-1 ${unlocked ? '' : 'wood-plank-locked'}`}>
      <div className="flex items-center gap-3">
        <img
          src={ICONS[achievement.iconName] ?? ICONS.trophy}
          alt=""
          aria-hidden="true"
          className="h-[52px] w-[52px] shrink-0 drop-shadow-[0_3px_0_rgba(74,42,18,0.35)]"
        />

        <div className="wood-bare min-w-0 flex-1 rounded-[12px] px-3 py-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="wood-deep font-display text-[19px] leading-tight">
              {achievement.title}
            </h4>

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
