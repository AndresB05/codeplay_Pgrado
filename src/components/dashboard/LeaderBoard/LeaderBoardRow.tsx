import type { LeaderboardEntry } from '../../../types/progress.types';

interface LeaderBoardRowProps {
  entry: LeaderboardEntry;
}

export const LeaderBoardRow = ({ entry }: LeaderBoardRowProps) => {
  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-400';
    return 'text-neutral-light';
  };

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
      <div className={`text-2xl font-bold ${getRankColor(entry.rank)} w-12 text-center`}>
        {getRankIcon(entry.rank)}
      </div>
      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
        <span className="text-xl">🎭</span>
      </div>
      <div className="flex-1">
        <p className="font-semibold text-neutral">{entry.fullName}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-secondary">{entry.xp} XP</p>
      </div>
    </div>
  );
};
