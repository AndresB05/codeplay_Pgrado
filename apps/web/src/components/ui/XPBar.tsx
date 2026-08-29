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
        <span className="text-sm font-medium text-ink-soft">
          {currentXP} / {maxXP} XP
        </span>
      )}
      <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-jungle-soft">
        <div
          className="h-full bg-gradient-to-r from-jungle-light to-jungle transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
