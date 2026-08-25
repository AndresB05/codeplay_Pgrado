import { AchievementItem } from './AchievementItem';

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

interface AchievementListProps {
  achievements: Achievement[];
}

export const AchievementList = ({ achievements }: AchievementListProps) => {
  const categories = Array.from(new Set(achievements.map((a) => a.category)));

  return (
    <div className="space-y-7">
      {categories.length === 0 ? (
        <p className="card px-5 py-10 text-center text-[16px] font-semibold text-ink-faint">
          Todavía no hay logros por aquí. ¡Sal a explorar la selva!
        </p>
      ) : null}

      {categories.map((category) => (
        <div key={category}>
          <h3 className="mb-4 font-display text-[20px] capitalize text-grape-dark">{category}</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {achievements
              .filter((a) => a.category === category)
              .map((achievement) => (
                <AchievementItem key={achievement.id} achievement={achievement} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
