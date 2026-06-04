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
    <div
      className={`relative rounded-xl p-4 transition-all ${
        achievement.unlocked
          ? 'bg-gradient-to-br from-primary to-primary-dark text-white'
          : 'bg-gray-100 text-gray-400'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-3xl">{achievement.icon}</span>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-lg mb-1">{achievement.name}</h4>
          <p className="text-sm opacity-90 mb-2">{achievement.description}</p>

          {!achievement.unlocked &&
            achievement.progress !== undefined &&
            achievement.target !== undefined && (
              <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}

          {achievement.unlocked && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg">✨</span>
              <span className="text-sm font-semibold">Desbloqueado</span>
            </div>
          )}
        </div>
      </div>

      {!achievement.unlocked && (
        <div className="absolute top-2 right-2 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-sm">🔒</span>
        </div>
      )}
    </div>
  );
};
