import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { endGuestSession } from '../../../context/guest.helpers';
import type { ClassGroup } from '../../../types/classroom.types';
import type { User } from '../../../types/user.types';
import { GroupBadge } from '../shared/GroupBadge';
import { getGroupTheme } from '../shared/groupThemes';
import { MonsteraLeaf, PalmFrond } from '../../decor/JungleDecor';
import { ChartIcon, GraduationIcon, LogoutIcon, SettingsIcon } from './TeacherIcons';

interface TeacherSidebarProps {
  user: User | null;
  groups: ClassGroup[];
  /** Id del salón abierto, o `null` fuera de la vista de un salón. */
  activeGroupId: string | null;
  /** Ruta base activa, para marcar la sección actual. */
  activeSection: string;
}

export const TeacherSidebar = ({
  user,
  groups,
  activeGroupId,
  activeSection,
}: TeacherSidebarProps) => {
  const navigate = useNavigate();

  const displayName = user?.fullName || 'Sr. Robot';
  const totalStudents = groups.reduce((total, group) => total + group.students.length, 0);
  const totalPending = groups.reduce((total, group) => total + group.pendingRequests.length, 0);

  const isGroupsSection = activeSection === ROUTES.TEACHER_GROUPS;

  const handleLogout = () => {
    endGuestSession();
    navigate(ROUTES.LANDING);
  };

  const navItems = [
    {
      route: ROUTES.TEACHER_GROUPS,
      label: 'Salón de clases',
      icon: GraduationIcon,
      active: isGroupsSection && activeGroupId === null,
    },
    {
      route: ROUTES.TEACHER_PANEL,
      label: 'Panel de información',
      icon: ChartIcon,
      active: activeSection === ROUTES.TEACHER_PANEL,
    },
    {
      route: ROUTES.TEACHER_SETTINGS,
      label: 'Ajustes de cuenta',
      icon: SettingsIcon,
      active: activeSection === ROUTES.TEACHER_SETTINGS,
    },
  ];

  return (
    <aside className="flex w-[262px] shrink-0 flex-col border-r-[3px] border-ink bg-white px-4 py-6">
      <div className="relative flex flex-col items-center">
        {/* Mismo gesto que en la barra del niño: la selva es de los dos roles. */}
        <MonsteraLeaf
          size={54}
          className="pointer-events-none absolute -left-1 top-1 rotate-[-18deg]"
          color="#1F9D5B"
        />
        <PalmFrond
          size={48}
          className="pointer-events-none absolute -right-1 top-2 -scale-x-100 rotate-[14deg]"
        />

        <div className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full border-[4px] border-ink bg-[linear-gradient(135deg,#7CE6DA_0%,#17C3B2_100%)] shadow-[0_6px_0_rgba(42,27,69,0.18)]">
          <svg width="58" height="58" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="24" r="12" fill="#FFF9EF" stroke="#2A1B45" strokeWidth="3.5" />
            <circle cx="27" cy="23" r="2.6" fill="#2A1B45" />
            <circle cx="37" cy="23" r="2.6" fill="#2A1B45" />
            <path
              d="M28 29C29.4 30.8 34.6 30.8 36 29"
              stroke="#2A1B45"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M14 52C16.5 44 23.5 40 32 40C40.5 40 47.5 44 50 52"
              fill="#FFC93C"
              stroke="#2A1B45"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="mt-4 text-center font-display text-[22px] leading-tight text-grape-dark">
          {displayName}
        </h2>

        <span className="chip chip-mint mt-2">Tutor</span>

        <p className="mt-2 text-center text-[14px] font-bold text-ink-faint">
          {groups.length} {groups.length === 1 ? 'salón' : 'salones'} · {totalStudents} niños
        </p>
      </div>

      <nav className="mt-7 space-y-2.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const showPending = item.route === ROUTES.TEACHER_GROUPS && totalPending > 0;

          return (
            <div key={item.route}>
              <button
                type="button"
                onClick={() => navigate(item.route)}
                className={`flex h-[52px] w-full items-center gap-3 rounded-[18px] border-[3px] px-4 text-left font-display text-[16px] transition-all ${
                  item.active
                    ? 'border-ink bg-grape text-white shadow-[0_4px_0_rgba(42,27,69,0.25)]'
                    : 'border-transparent text-ink hover:border-line hover:bg-cream'
                }`}
              >
                <Icon active={item.active} />
                <span className="flex-1">{item.label}</span>

                {showPending ? (
                  <span className="flex h-[26px] min-w-[26px] items-center justify-center rounded-full border-2 border-ink bg-sun px-1.5 text-[13px] text-ink">
                    {totalPending}
                  </span>
                ) : null}
              </button>

              {/* Los salones cuelgan de "Salón de clases": es la navegación rápida entre grupos. */}
              {item.route === ROUTES.TEACHER_GROUPS ? (
                <div className="mt-2 space-y-1.5 pl-1">
                  {groups.map((group) => {
                    const isActive = isGroupsSection && activeGroupId === group.id;
                    const theme = getGroupTheme(group.id);

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => navigate(`${ROUTES.TEACHER_GROUPS}/${group.id}`)}
                        className={`flex w-full items-center gap-2.5 rounded-[16px] border-2 px-3 py-2 text-left transition-colors ${
                          isActive
                            ? 'border-ink bg-cream'
                            : 'border-transparent hover:border-line hover:bg-cream'
                        }`}
                      >
                        <GroupBadge theme={theme} size={34} />
                        <span className="flex-1 truncate text-[15px] font-bold text-ink">
                          {group.name}
                        </span>
                        <span className="text-[13px] font-bold text-ink-faint">
                          {group.students.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[18px] border-[3px] border-transparent px-3 py-3 text-left font-display text-[16px] text-coral-dark transition-colors hover:border-coral-soft hover:bg-coral-soft"
        >
          <LogoutIcon />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};
