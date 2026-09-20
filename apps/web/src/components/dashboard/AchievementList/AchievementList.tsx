import { AchievementItem } from './AchievementItem';
import type { CatalogAchievement } from '../../../services/achievements.service';

interface AchievementListProps {
  achievements: CatalogAchievement[];
}

/**
 * El catálogo entero, lo conseguido primero y lo que falta detrás.
 *
 * Los ganados suben a propósito: el niño viene a ver lo suyo, y dejar los veinte
 * en el orden del catálogo enterraría sus tres logros entre diecisiete casillas
 * vacías. Dentro de cada mitad manda el orden del catálogo, que agrupa por
 * familia.
 */
export const AchievementList = ({ achievements }: AchievementListProps) => {
  if (achievements.length === 0) {
    return (
      <p className="card px-5 py-10 text-center text-[16px] font-semibold text-ink-faint">
        Todavía no hay logros por aquí. ¡Sal a explorar la selva!
      </p>
    );
  }

  const ordered = [...achievements].sort((one, other) => {
    const mineFirst = Number(other.unlockedAt !== null) - Number(one.unlockedAt !== null);

    return mineFirst !== 0 ? mineFirst : one.sortOrder - other.sortOrder;
  });

  const won = ordered.filter((achievement) => achievement.unlockedAt !== null).length;

  return (
    <>
      <p className="mb-4 text-[15px] font-bold text-ink-soft">
        Llevas {won} de {achievements.length}.
      </p>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {ordered.map((achievement) => (
          <AchievementItem key={achievement.key} achievement={achievement} />
        ))}
      </div>
    </>
  );
};
