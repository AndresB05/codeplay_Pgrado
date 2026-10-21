import { useNavigate } from 'react-router-dom';
import { STUDENT_NAV_ITEMS } from './studentNav';

type StudentBottomNavProps = {
  activeRoute: string;
};

export const StudentBottomNav = ({ activeRoute }: StudentBottomNavProps) => {
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Secciones"
      className="bottom-nav wood-bottom-bar flex gap-2 border-t-4 border-wood-ink px-2 pt-2"
    >
      {STUDENT_NAV_ITEMS.map((item) => {
        const isActive = activeRoute === item.route;
        const Icon = item.icon;

        return (
          <button
            key={item.route}
            type="button"
            onClick={() => navigate(item.route)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] border-[3px] px-1 font-display text-[12.5px] leading-tight ${
              isActive ? 'wood-key wood-key-current' : 'wood-key text-ink'
            }`}
          >
            <Icon active={isActive} />
            <span className="max-w-full truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
