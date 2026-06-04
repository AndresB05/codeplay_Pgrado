interface StreakBadgeProps {
  streakDays: number;
}

export const StreakBadge = ({ streakDays }: StreakBadgeProps) => {
  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 rounded-full">
      <span className="text-2xl">🔥</span>
      <span className="text-white font-bold text-lg">{streakDays}</span>
      <span className="text-white text-sm">días</span>
    </div>
  );
};
