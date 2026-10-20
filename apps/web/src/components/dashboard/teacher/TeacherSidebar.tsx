import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { endGuestSession } from '../../../context/guest.helpers';
import { useAuth } from '../../../hooks/useAuth';
import type { ClassGroup } from '../../../types/classroom.types';
import { getGroupTheme } from '../shared/groupThemes';
import { ChartIcon, GraduationIcon, LogoutIcon, SettingsIcon } from './TeacherIcons';
import { useSidebarCollapsed } from '../../../hooks/useSidebarCollapsed';
import { SidebarToggle } from '../Sidebar/SidebarToggle';

interface TeacherSidebarProps {
  groups: ClassGroup[];
  /** Id del salón abierto, o `null` fuera de la vista de un salón. */
  activeGroupId: string | null;
  /** Ruta base activa, para marcar la sección actual. */
  activeSection: string;
}

export const TeacherSidebar = ({ groups, activeGroupId, activeSection }: TeacherSidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

  const totalPending = groups.reduce((total, group) => total + group.pendingRequests.length, 0);

  const isGroupsSection = activeSection === ROUTES.TEACHER_GROUPS;

  /* Ver `Sidebar.tsx`: sin `signOut` la sesión de Supabase sobreviviría. */
  const handleLogout = async (): Promise<void> => {
    endGuestSession();
    await signOut();
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
    <aside
      className={`relative flex shrink-0 flex-col border-r border-tutor-rule bg-tutor-surface py-4 ${
        collapsed ? 'w-[64px] px-2' : 'w-[240px] px-3'
      }`}
    >
      <SidebarToggle collapsed={collapsed} onToggle={toggleCollapsed} variant="tutor" />

      <nav className={`${collapsed ? 'mt-10' : 'mt-1'} space-y-1`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const showPending = item.route === ROUTES.TEACHER_GROUPS && totalPending > 0;
          const pendingLabel = `${totalPending} ${totalPending === 1 ? 'solicitud' : 'solicitudes'} en espera`;

          return (
            <div key={item.route}>
              <button
                type="button"
                onClick={() => navigate(item.route)}
                aria-label={
                  collapsed ? `${item.label}${showPending ? `, ${pendingLabel}` : ''}` : undefined
                }
                aria-current={item.active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={`tutor-focus relative flex h-[36px] w-full items-center gap-2.5 rounded-[8px] text-left text-[14.5px] font-semibold transition-colors ${
                  collapsed ? 'justify-center px-0' : 'px-2.5'
                } ${
                  item.active
                    ? 'bg-tutor-accent-soft text-tutor-accent'
                    : 'text-tutor-ink-soft hover:bg-tutor-canvas hover:text-tutor-ink'
                }`}
              >
                <Icon variant="tutor" />
                {collapsed ? null : <span className="flex-1 truncate">{item.label}</span>}

                {showPending ? (
                  <span
                    title={pendingLabel}
                    className={`flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-tutor-warn-soft px-1.5 text-[12.5px] font-semibold text-tutor-warn ${
                      collapsed ? 'absolute -right-1 -top-1 ring-2 ring-tutor-surface' : ''
                    }`}
                  >
                    {totalPending}
                    <span className="sr-only"> {pendingLabel}</span>
                  </span>
                ) : null}
              </button>

              {/*
               * Los salones cuelgan de "Salón de clases": es la navegación rápida
               * entre grupos. Aquí sólo va la pestaña de color; la insignia
               * ilustrada se queda donde hay sitio, en la tarjeta y la cabecera.
               */}
              {item.route === ROUTES.TEACHER_GROUPS ? (
                <div className={`mt-1 space-y-0.5 ${collapsed ? '' : 'pl-2'}`}>
                  {groups.map((group) => {
                    const isActive = isGroupsSection && activeGroupId === group.id;
                    const theme = getGroupTheme(group.id);

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => navigate(`${ROUTES.TEACHER_GROUPS}/${group.id}`)}
                        aria-label={collapsed ? group.name : undefined}
                        aria-current={isActive ? 'page' : undefined}
                        title={collapsed ? group.name : undefined}
                        className={`tutor-focus flex h-[34px] w-full items-center gap-2.5 rounded-[8px] text-left transition-colors ${
                          collapsed ? 'justify-center px-0' : 'px-2.5'
                        } ${
                          isActive
                            ? 'bg-tutor-canvas font-semibold text-tutor-ink'
                            : 'text-tutor-ink hover:bg-tutor-canvas'
                        }`}
                      >
                        <span
                          aria-hidden
                          className="h-[18px] w-[4px] shrink-0 rounded-full"
                          style={{ background: theme.color }}
                        />
                        {collapsed ? (
                          <span aria-hidden className="text-[13.5px] font-semibold uppercase">
                            {group.name.trim().charAt(0)}
                          </span>
                        ) : (
                          <>
                            <span title={group.name} className="flex-1 truncate text-[14px]">
                              {group.name}
                            </span>
                            <span className="text-[13px] text-tutor-ink-faint">
                              {group.students.length}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={() => void handleLogout()}
          aria-label={collapsed ? 'Cerrar sesión' : undefined}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={`tutor-focus flex h-[36px] w-full items-center gap-2.5 rounded-[8px] text-left text-[14.5px] font-semibold text-tutor-danger transition-colors hover:bg-tutor-danger-soft ${
            collapsed ? 'justify-center px-0' : 'px-2.5'
          }`}
        >
          <LogoutIcon variant="tutor" />
          {collapsed ? null : 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  );
};
