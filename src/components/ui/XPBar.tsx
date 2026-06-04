interface XPBarProps {
  currentXP: number;
  maxXP: number;
  showLabel?: boolean;
}

export const XPBar = ({ currentXP, maxXP, showLabel = true }: XPBarProps) => {
  const percentage = Math.min((currentXP / maxXP) * 100, 100);

  return (
    <div className="flex flex-col gap-1">
      {showLabel && (
        <span className="text-sm font-medium text-neutral-light">
          {currentXP} / {maxXP} XP
        </span>
      )}
      <div className="w-full h-3 bg-neutral-dark rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-secondary to-secondary-light transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
