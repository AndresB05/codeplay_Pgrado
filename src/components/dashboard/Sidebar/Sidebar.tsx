import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import type { User } from '../../../types/user.types';

type SidebarProps = {
  user: User | null;
  activeRoute: string;
};

const CompassIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8.25" stroke={active ? '#FFFFFF' : '#5B5567'} strokeWidth="2" />
    <path
      d="M10 14L11.7 10.3L15.4 8.6L13.7 12.3L10 14Z"
      stroke={active ? '#FFFFFF' : '#5B5567'}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const TrophyIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 20H16M12 16V20M8.5 4H15.5V8.5C15.5 10.43 13.93 12 12 12C10.07 12 8.5 10.43 8.5 8.5V4ZM8.5 5.5H6.5C5.4 5.5 4.5 6.4 4.5 7.5C4.5 9.71 6.29 11.5 8.5 11.5M15.5 5.5H17.5C18.6 5.5 19.5 6.4 19.5 7.5C19.5 9.71 17.71 11.5 15.5 11.5"
      stroke={active ? '#FFFFFF' : '#5B5567'}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GraduationIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 9.5L12 5L21 9.5L12 14L3 9.5Z"
      stroke={active ? '#FFFFFF' : '#5B5567'}
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path
      d="M7 11.5V15.5C7 16.5 9.24 18 12 18C14.76 18 17 16.5 17 15.5V11.5"
      stroke={active ? '#FFFFFF' : '#5B5567'}
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 17L15 12L10 7"
      stroke="#E53935"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M15 12H6" stroke="#E53935" strokeWidth="1.9" strokeLinecap="round" />
    <path
      d="M12 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H12"
      stroke="#E53935"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

const FireIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.4 3C13.4 6.2 10.2 7.2 10.2 10.1C10.2 11.2 10.8 12.1 11.7 12.7C8.8 12.7 6.5 14.9 6.5 17.8C6.5 20.4 8.6 22.5 11.2 22.5C15.4 22.5 18.5 19.3 18.5 15.2C18.5 10.8 15.8 8.6 14.6 6.7C14.1 5.9 13.8 4.9 13.4 3Z"
      stroke="#9A6500"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Sidebar = ({ user, activeRoute }: SidebarProps) => {
  const navigate = useNavigate();

  const displayName = user?.fullName || 'Explorer Leo';
  const streakDays = user?.streakDays || 42;

  const navItems = [
    { route: ROUTES.WORLDS, label: 'Mundos', icon: CompassIcon },
    { route: ROUTES.TROPHY_ROOM, label: 'Sala de Trofeos', icon: TrophyIcon },
    { route: ROUTES.CLASSROOM, label: 'Salón de clases', icon: GraduationIcon },
  ];

  const handleTemporaryLogout = () => {
    navigate(ROUTES.LANDING);
  };

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-[#D9D0E8] bg-[#F6F3FA] px-3 py-7">
      <div className="flex flex-col items-center pt-2">
        <div className="flex h-[108px] w-[108px] items-center justify-center rounded-full border-[4px] border-[#E9E1F7] bg-[radial-gradient(circle_at_top,_#3A3A47_0%,_#13131A_90%)] text-[14px] font-medium text-white shadow-[0_12px_26px_rgba(31,26,38,0.18)]">
          Avatar
        </div>

        <h2 className="mt-6 text-center text-[31px] font-semibold tracking-[-0.03em] text-[#6D42D9]">
          {displayName}
        </h2>

        <div className="mt-2 flex items-center gap-2 text-[18px] text-[#7A5207]">
          <FireIcon />
          <span>{streakDays} Streak Days</span>
        </div>
      </div>

      <nav className="mt-14 space-y-4">
        {navItems.map((item) => {
          const isActive = activeRoute === item.route;
          const Icon = item.icon;

          return (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className={`flex h-[50px] w-full items-center gap-3 rounded-full px-4 text-left transition-colors ${
                isActive
                  ? 'bg-[#8B5CF6] text-white shadow-[0_10px_18px_rgba(139,92,246,0.28)]'
                  : 'text-[#3E3749] hover:bg-white'
              }`}
            >
              <Icon active={isActive} />
              <span className="text-[16px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-10">
        <button
          type="button"
          onClick={handleTemporaryLogout}
          className="flex w-full items-center gap-3 rounded-full px-3 py-3 text-left text-[#E53935] transition-colors hover:bg-white"
        >
          <LogoutIcon />
          <span className="text-[17px] font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
