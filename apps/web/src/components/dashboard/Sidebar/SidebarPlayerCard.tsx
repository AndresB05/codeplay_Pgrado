import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { StreakBadge } from '../../ui/StreakBadge';
import type { User } from '../../../types/user.types';

interface SidebarPlayerCardProps {
  user: User | null;
}

export const SidebarPlayerCard = ({ user }: SidebarPlayerCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-neutral-dark rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
          <span className="text-2xl">🎭</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white">{user?.fullName || 'Explorador'}</p>
          <p className="text-sm text-neutral-light">{user?.xp || 0} XP</p>
        </div>
      </div>
      <StreakBadge streakDays={user?.streakDays || 0} />
      <button
        onClick={() => navigate(ROUTES.WORLDS)}
        className="w-full mt-3 bg-secondary hover:bg-secondary-dark text-white font-semibold py-2 px-4 rounded-lg transition-all"
      >
        Iniciar Expedición
      </button>
    </div>
  );
};
