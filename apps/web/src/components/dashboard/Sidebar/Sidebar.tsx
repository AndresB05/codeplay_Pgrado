import { useNavigate } from 'react-router-dom';
import streakScroll from '../../../assets/brand/sidebar-streak-scroll-bold.webp';
import { pickMascotAvatar } from '../../../constants/mascotAvatars';
import { FALLBACK_STUDENT_NAME } from '../../../services/classrooms.service';
import type { User } from '../../../types/user.types';
import { XPBar } from '../../ui/XPBar';
import { streakLabel } from '../../../lib/streak';
import { useSidebarCollapsed } from '../../../hooks/useSidebarCollapsed';
import { SidebarToggle } from './SidebarToggle';
import { STUDENT_NAV_ITEMS } from './studentNav';

type SidebarProps = {
  user: User | null;
  activeRoute: string;
};

export const Sidebar = ({ user, activeRoute }: SidebarProps) => {
  const navigate = useNavigate();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

  const displayName = user?.fullName || FALLBACK_STUDENT_NAME;
  /*
   * `??` y no `||`: la racha en cero es legítima, y con `||` caía SIEMPRE en el
   * valor de relleno. Una cuenta recién creada enseñaba «42 días» aquí y «42» en
   * la barra superior a la vez, contradiciendo el cero verdadero de la tabla del
   * salón.
   */
  const streakDays = user?.streakDays ?? 0;

  return (
    <aside
      className={`relative isolate z-20 flex shrink-0 flex-col py-6 ${
        collapsed ? 'w-[92px] pl-2.5 pr-4' : 'w-[262px] pl-5 pr-8'
      }`}
    >
      {/*
       * El tronco sobresale por la derecha y va por encima de los módulos: con el
       * borde justo en el de la barra quedaba una franja vacía entre los dos. La
       * barra entera va en `z-20` por eso, y de paso la pestaña de plegar ya no
       * queda detrás del contenido.
       */}
      <div
        aria-hidden="true"
        className="sidebar-log pointer-events-none absolute inset-y-0 -right-4 left-0 -z-10"
      />

      <SidebarToggle collapsed={collapsed} onToggle={toggleCollapsed} wooden />

      {/* Plegada se queda sin la ficha: la barra superior ya enseña racha y XP. */}
      {collapsed ? null : (
        <div className="relative flex flex-col items-center">
          <div className="relative h-[112px] w-[112px] overflow-hidden rounded-full border-[4px] border-ink bg-white shadow-[0_6px_0_rgba(42,27,69,0.2)]">
            <img
              src={pickMascotAvatar(user?.id, user?.fullName, user?.avatarKey)}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

          <h2 className="dark-wood-label mt-4 text-center font-display text-[24px] leading-tight">
            {displayName}
          </h2>

          {/* La racha en una tira de pergamino clavada al tronco; en gris mientras está en cero. */}
          <div
            className={`relative mt-2 h-[55px] w-[162px] drop-shadow-[0_3px_0_rgba(74,42,18,0.45)] ${
              streakDays === 0 ? 'grayscale' : ''
            }`}
          >
            <img src={streakScroll} alt="" className="h-full w-full" />
            <span className="absolute inset-y-0 left-[46px] right-[12px] flex items-center justify-center font-map text-[22px] leading-none text-sepia">
              {streakLabel(streakDays)}
            </span>
          </div>
        </div>
      )}

      {/* El XP sale de la ficha para que el panel tallado lo abarque junto a los botones. */}
      <div className={`relative isolate ${collapsed ? 'mt-12' : 'mt-7'}`}>
        <div
          aria-hidden="true"
          className={`sidebar-panel pointer-events-none absolute -z-10 ${
            collapsed ? '-inset-x-3 -bottom-6 -top-5' : '-inset-x-5 -bottom-6 -top-5'
          }`}
        />

        {collapsed ? null : (
          <div className="wood-bare w-full rounded-[12px] px-3 py-2">
            <XPBar xp={user?.xp ?? 0} />
          </div>
        )}

        <nav className={`${collapsed ? '' : 'mt-8'} space-y-2.5`}>
          {STUDENT_NAV_ITEMS.map((item) => {
            const isActive = activeRoute === item.route;
            const Icon = item.icon;

            return (
              <button
                key={item.route}
                type="button"
                onClick={() => navigate(item.route)}
                aria-label={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={`flex h-[54px] w-full items-center gap-3 rounded-[18px] border-[3px] text-left font-display text-[16px] ${
                  collapsed ? 'justify-center px-0' : 'px-4'
                } ${isActive ? 'wood-key wood-key-current' : 'wood-key text-ink'}`}
              >
                <Icon active={isActive} />
                {collapsed ? null : <span>{item.label}</span>}
                {'dev' in item && !collapsed ? (
                  <span className="ml-auto rounded-full border-2 border-dashed border-line px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-faint">
                    Dev
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
