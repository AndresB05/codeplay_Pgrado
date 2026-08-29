import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { endGuestSession } from '../../../context/guest.helpers';
import { useAuth } from '../../../hooks/useAuth';
import { FALLBACK_TEACHER_NAME } from '../../../services/classrooms.service';
import type { ClassGroup } from '../../../types/classroom.types';
import type { User } from '../../../types/user.types';
import { ChangeNamePanel } from '../shared/ChangeNamePanel';
import { ChangePasswordPanel } from '../shared/ChangePasswordPanel';
import { GroupBadge } from '../shared/GroupBadge';
import { getGroupTheme } from '../shared/groupThemes';

interface TeacherSettingsModuleProps {
  user: User | null;
  groups: ClassGroup[];
}

export const TeacherSettingsModule = ({ user, groups }: TeacherSettingsModuleProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const displayName = user?.fullName || FALLBACK_TEACHER_NAME;
  const email = user?.email;
  const totalStudents = groups.reduce((total, group) => total + group.students.length, 0);

  const handleSignOut = async (): Promise<void> => {
    endGuestSession();

    // Ver `StudentSettingsModule`: `signOut` es lo que cierra la sesión real y
    // `endGuestSession` sólo limpia el atajo antiguo.
    await signOut();
    navigate(ROUTES.LANDING);
  };

  return (
    <div className="px-5 py-5">
      <div className="mx-auto max-w-[980px]">
        <section className="card flex flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <span className="chip chip-grape">Cuenta</span>
            <h1 className="title-xl mt-2">Mi cuenta</h1>
          </div>

          <button type="button" onClick={() => void handleSignOut()} className="btn btn-coral">
            Cerrar sesión
          </button>
        </section>

        <section className="card mt-6 px-6 py-6">
          <h2 className="title-lg">Detalles del usuario</h2>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-[112px] w-[112px] shrink-0 items-center justify-center rounded-[28px] border-[3px] border-ink bg-[linear-gradient(135deg,#7CE6DA_0%,#17C3B2_100%)] shadow-[0_6px_0_rgba(42,27,69,0.18)]">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
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

            <div className="min-w-0 flex-1">
              <h3 className="font-display text-[30px] leading-tight text-grape-dark">
                {displayName}
              </h3>
              <p className="mt-1 text-[16px] font-bold text-ink-soft">
                {groups.length} {groups.length === 1 ? 'salón' : 'salones'} · {totalStudents} niños
                a cargo
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-[18px] border-2 border-line bg-cream px-4 py-3">
                  <p className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-faint">
                    Email
                  </p>
                  <p className="mt-1 break-words text-[17px] font-bold text-ink">
                    {email ?? <span className="text-ink-faint">Sin correo asociado</span>}
                  </p>
                </div>

                <div className="rounded-[18px] border-2 border-line bg-cream px-4 py-3">
                  <p className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-faint">
                    Rol
                  </p>
                  <p className="mt-1 text-[17px] font-bold text-mint-dark">Tutor</p>
                </div>
              </div>

              <ChangeNamePanel />
              <ChangePasswordPanel />
            </div>
          </div>
        </section>

        <section className="card mt-6 px-6 py-6">
          <h2 className="title-lg">Mis salones</h2>

          <ul className="mt-5 space-y-3">
            {groups.map((group) => {
              const theme = getGroupTheme(group.id);

              return (
                <li
                  key={group.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border-2 border-line bg-cream px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <GroupBadge theme={theme} size={48} />

                    <div>
                      <p className="font-display text-[18px] text-ink">{group.name}</p>
                      <p className="text-[14px] font-bold text-ink-faint">{group.gradeLabel}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-bold text-ink-soft">
                      {group.students.length}/{group.capacity} niños
                    </span>

                    <button
                      type="button"
                      onClick={() => navigate(`${ROUTES.TEACHER_GROUPS}/${group.id}`)}
                      className="btn btn-sm btn-ghost"
                    >
                      Abrir
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
};
