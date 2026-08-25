import { AchievementItem } from './AchievementItem';
import type { UnlockedAchievement } from '../../../services/achievements.service';

interface AchievementListProps {
  achievements: UnlockedAchievement[];
}

/**
 * Sólo lista los logros conseguidos. Agrupar por categoría o mostrar el avance
 * hacia los pendientes exige un catálogo de definiciones que el esquema no
 * tiene: es el paso 22 del roadmap.
 */
export const AchievementList = ({ achievements }: AchievementListProps) => {
  if (achievements.length === 0) {
    return (
      <p className="card px-5 py-10 text-center text-[16px] font-semibold text-ink-faint">
        Todavía no hay logros por aquí. ¡Sal a explorar la selva!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {achievements.map((achievement) => (
        <AchievementItem key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
};
