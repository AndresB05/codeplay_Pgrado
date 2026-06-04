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
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-xl font-bold text-neutral mb-4 capitalize">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
