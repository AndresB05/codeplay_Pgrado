import { useNavigate } from 'react-router-dom';
import { PROVISIONAL_MAX_XP } from '../../../constants/progress';
import { ROUTES } from '../../../constants/routes';
import { endGuestSession } from '../../../context/guest.helpers';
import { useAuth } from '../../../hooks/useAuth';
import { FALLBACK_STUDENT_NAME } from '../../../services/classrooms.service';
import type { User } from '../../../types/user.types';
import { MonsteraLeaf, PalmFrond } from '../../decor/JungleDecor';
import { XPBar } from '../../ui/XPBar';

type SidebarProps = {
  user: User | null;
  activeRoute: string;
};

const CompassIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8.5" stroke={active ? '#FFFFFF' : '#2A1B45'} strokeWidth="2.4" />
    <path
      d="M9.6 14.4L11.4 10.2L15.6 8.4L13.8 12.6L9.6 14.4Z"
      fill={active ? '#FFC93C' : '#7B3FE4'}
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const TrophyIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.5 4H15.5V9C15.5 10.93 13.93 12.5 12 12.5C10.07 12.5 8.5 10.93 8.5 9V4Z"
      fill={active ? '#FFC93C' : '#FFE29A'}
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 5.5H6.3C5.3 5.5 4.5 6.3 4.5 7.3C4.5 9.5 6.3 11.3 8.5 11.3M15.5 5.5H17.7C18.7 5.5 19.5 6.3 19.5 7.3C19.5 9.5 17.7 11.3 15.5 11.3"
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M12 12.5V17M8.5 20H15.5"
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

const GraduationIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 9.5L12 5L21 9.5L12 14L3 9.5Z"
      fill={active ? '#FFC93C' : '#D6F7F3'}
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M7 11.5V15.5C7 16.5 9.24 18 12 18C14.76 18 17 16.5 17 15.5V11.5"
      stroke={active ? '#FFFFFF' : '#2A1B45'}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 17L15 12L10 7"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M15 12H6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <path
      d="M12 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H12"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

const FireIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.4 3C13.4 6.2 10.2 7.2 10.2 10.1C10.2 11.2 10.8 12.1 11.7 12.7C8.8 12.7 6.5 14.9 6.5 17.8C6.5 20.4 8.6 22.5 11.2 22.5C15.4 22.5 18.5 19.3 18.5 15.2C18.5 10.8 15.8 8.6 14.6 6.7C14.1 5.9 13.8 4.9 13.4 3Z"
      fill="#FFC93C"
      stroke="#2A1B45"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const Sidebar = ({ user, activeRoute }: SidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const displayName = user?.fullName || FALLBACK_STUDENT_NAME;
  /*
   * `??` y no `||`: la racha en cero es legítima, y con `||` caía SIEMPRE en el
   * valor de relleno. Una cuenta recién creada enseñaba «42 días» aquí y «42» en
   * la barra superior a la vez, contradiciendo el cero verdadero de la tabla del
   * salón.
   */
  const streakDays = user?.streakDays ?? 0;

  const navItems = [
    { route: ROUTES.WORLDS, label: 'Mundos', icon: CompassIcon },
    { route: ROUTES.TROPHY_ROOM, label: 'Sala de Trofeos', icon: TrophyIcon },
    { route: ROUTES.CLASSROOM, label: 'Salón de clases', icon: GraduationIcon },
  ];

  /*
   * Borrar la marca de invitado no basta: el acceso sin login autentica de
   * verdad cuando hay cuentas de prueba, y sin `signOut` la sesión de Supabase
   * sobreviviría. `PrivateRoute` la daría por buena y se volvería al panel
   * escribiendo la dirección.
   */
  const handleTemporaryLogout = async (): Promise<void> => {
    endGuestSession();
    await signOut();
    navigate(ROUTES.LANDING);
  };

  return (
    <aside className="flex w-[262px] shrink-0 flex-col border-r-[3px] border-ink bg-white px-4 py-6">
      <div className="relative flex flex-col items-center">
        {/* Hojas asomando tras el avatar: la selva entra también en la barra. */}
        <MonsteraLeaf
          size={58}
          className="pointer-events-none absolute -left-1 top-1 rotate-[-18deg]"
          color="#1F9D5B"
        />
        <PalmFrond
          size={52}
          className="pointer-events-none absolute -right-1 top-2 -scale-x-100 rotate-[14deg]"
        />

        <div className="relative flex h-[112px] w-[112px] items-center justify-center rounded-full border-[4px] border-ink bg-[linear-gradient(135deg,#A77BF3_0%,#7B3FE4_100%)] shadow-[0_6px_0_rgba(42,27,69,0.2)]">
          <svg width="66" height="66" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="26" r="13" fill="#FFF9EF" stroke="#2A1B45" strokeWidth="4" />
            <circle cx="27" cy="25" r="2.8" fill="#2A1B45" />
            <circle cx="37" cy="25" r="2.8" fill="#2A1B45" />
            <path
              d="M28 31C29.5 33 34.5 33 36 31"
              stroke="#2A1B45"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M14 54C16.5 46 23.5 42 32 42C40.5 42 47.5 46 50 54"
              fill="#FFC93C"
              stroke="#2A1B45"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="mt-4 text-center font-display text-[24px] leading-tight text-grape-dark">
          {displayName}
        </h2>

        <div className="mt-2 flex items-center gap-2 rounded-full border-2 border-ink bg-sun-soft px-4 py-1 font-display text-[16px] text-sun-dark">
          <FireIcon />
          <span>{streakDays} días</span>
        </div>

        <div className="mt-3 w-full px-1">
          <XPBar currentXP={user?.xp ?? 0} maxXP={PROVISIONAL_MAX_XP} />
        </div>
      </div>

      <nav className="mt-8 space-y-2.5">
        {navItems.map((item) => {
          const isActive = activeRoute === item.route;
          const Icon = item.icon;

          return (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className={`flex h-[54px] w-full items-center gap-3 rounded-[18px] border-[3px] px-4 text-left font-display text-[16px] transition-all ${
                isActive
                  ? 'border-ink bg-grape text-white shadow-[0_4px_0_rgba(42,27,69,0.25)]'
                  : 'border-transparent text-ink hover:border-line hover:bg-cream'
              }`}
            >
              <Icon active={isActive} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={() => void handleTemporaryLogout()}
          className="flex w-full items-center gap-3 rounded-[18px] border-[3px] border-transparent px-3 py-3 text-left font-display text-[16px] text-coral-dark transition-colors hover:border-coral-soft hover:bg-coral-soft"
        >
          <LogoutIcon />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};
