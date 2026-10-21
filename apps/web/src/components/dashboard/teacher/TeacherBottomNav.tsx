import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import type { ClassGroup } from '../../../types/classroom.types';
import { pendingRequestsLabel, teacherNavItems } from './teacherNav';

interface TeacherBottomNavProps {
  groups: ClassGroup[];
  activeGroupId: string | null;
  activeSection: string;
}

/*
 * La lista de salones no baja aquí: en el móvil se llega a cada uno desde «Mis
 * salones» y se salta entre ellos con «Ir a otro salón».
 */
export const TeacherBottomNav = ({
  groups,
  activeGroupId,
  activeSection,
}: TeacherBottomNavProps) => {
  const navigate = useNavigate();
  const totalPending = groups.reduce((total, group) => total + group.pendingRequests.length, 0);

  return (
    <nav
      aria-label="Secciones"
      className="bottom-nav flex border-t border-tutor-rule bg-tutor-surface px-1"
    >
      {teacherNavItems(activeSection, activeGroupId).map((item) => {
        const Icon = item.icon;
        const showPending = item.route === ROUTES.TEACHER_GROUPS && totalPending > 0;

        return (
          <button
            key={item.route}
            type="button"
            onClick={() => navigate(item.route)}
            aria-label={`${item.label}${showPending ? `, ${pendingRequestsLabel(totalPending)}` : ''}`}
            aria-current={item.active ? 'page' : undefined}
            className={`tutor-focus relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[12.5px] font-semibold transition-colors ${
              item.active ? 'text-tutor-accent' : 'text-tutor-ink-soft hover:text-tutor-ink'
            }`}
          >
            <span
              className={`relative flex h-[30px] w-[52px] items-center justify-center rounded-full ${
                item.active ? 'bg-tutor-accent-soft' : ''
              }`}
            >
              <Icon variant="tutor" />
              {showPending ? (
                <span
                  aria-hidden
                  className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-tutor-warn-soft px-1 text-[11.5px] font-semibold text-tutor-warn ring-2 ring-tutor-surface"
                >
                  {totalPending}
                </span>
              ) : null}
            </span>
            <span className="max-w-full truncate">{item.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
};
