import { StreakBadge } from '../../ui/StreakBadge';
import { XPBar } from '../../ui/XPBar';
import type { User } from '../../../types/user.types';

interface WelcomeBannerProps {
  user: User | null;
}

export const WelcomeBanner = ({ user }: WelcomeBannerProps) => {
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  return (
    <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 text-white mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
            <span className="text-5xl">🎭</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-1">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Explorador'}!
            </h2>
            <p className="text-white/90">Continúa tu aventura de programación</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <StreakBadge streakDays={user?.streakDays || 0} />
          <div className="w-48">
            <XPBar currentXP={user?.xp || 0} maxXP={1000} showLabel={false} />
          </div>
        </div>
      </div>
    </div>
  );
};
