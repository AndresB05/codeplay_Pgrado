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
    <article className={`card px-5 py-5 ${unlocked ? '' : 'border-dashed'}`}>
      <div className="flex items-start gap-4">
        {/*
         * El pendiente va en gris y SIN el dibujo, no con él apagado: un icono
         * a media tinta se lee como un fallo de carga, y el hueco dice mejor que
         * eso todavía está por ganar.
         */}
        <span
          className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[20px] border-[3px] text-[28px] ${
            unlocked ? 'border-ink bg-sun' : 'border-dashed border-line bg-cream'
          }`}
          aria-hidden="true"
        >
          {unlocked ? (ICONS[achievement.iconName] ?? ICONS.trophy) : ''}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`font-display text-[19px] leading-tight ${
                unlocked ? 'text-ink' : 'text-ink-faint'
              }`}
            >
              {achievement.title}
            </h4>

            {/*
             * Las palabras distinguen los dos estados, no sólo el color: para
             * quien no lo distinga, «Desbloqueado» y «Por conseguir» son lo
             * único que queda.
             */}
            {unlocked ? (
              <span className="chip chip-mint">✨ Desbloqueado</span>
            ) : (
              <span className="chip chip-grape">Por conseguir</span>
            )}
          </div>

          <p
            className={`mt-1 text-[15px] font-semibold leading-[1.6] ${
              unlocked ? 'text-ink-soft' : 'text-ink-faint'
            }`}
          >
            {achievement.description}
          </p>

          <p className="mt-3 text-[13px] font-bold uppercase tracking-[0.04em] text-ink-faint">
            {achievement.unlockedAt === null
              ? `+${achievement.awardedXp} XP`
              : `${formatUnlockedAt(achievement.unlockedAt)} · +${achievement.awardedXp} XP`}
          </p>
        </div>
      </div>
    </article>
  );
};
