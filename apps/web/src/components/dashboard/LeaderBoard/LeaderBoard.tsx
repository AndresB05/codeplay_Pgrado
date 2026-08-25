import { LeaderBoardRow } from './LeaderBoardRow';
import type { LeaderboardEntry } from '../../../types/progress.types';

interface LeaderBoardProps {
  leaderboard: LeaderboardEntry[];
  loading?: boolean;
}

export const LeaderBoard = ({ leaderboard, loading = false }: LeaderBoardProps) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-neutral mb-4">Tabla de Líderes</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-neutral mb-4">Tabla de Líderes</h2>
      <div className="space-y-3">
        {leaderboard.map((entry) => (
          <LeaderBoardRow key={entry.userId} entry={entry} />
        ))}
      </div>
    </div>
  );
};
