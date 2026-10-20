import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { endGuestSession } from '../../../context/guest.helpers';
import { useAuth } from '../../../hooks/useAuth';
import { FALLBACK_TEACHER_NAME } from '../../../services/classrooms.service';
import type { ClassGroup } from '../../../types/classroom.types';
import type { User } from '../../../types/user.types';
import { TUTOR_AVATAR } from '../../../constants/mascotAvatars';
import { ChangeNamePanel } from '../shared/ChangeNamePanel';
import { ChangePasswordPanel } from '../shared/ChangePasswordPanel';
import { DeleteAccountPanel } from '../shared/DeleteAccountPanel';
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
    <div className="px-6 py-6 lg:px-8">
      <div className="max-w-[980px]">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] leading-tight text-tutor-ink">Mi cuenta</h1>
            <p className="mt-1 text-tutor-ink-soft">Tus datos, tu contraseña y tus salones.</p>
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="tutor-btn tutor-btn-danger"
          >
            Cerrar sesión
          </button>
        </section>

        <section className="tutor-card mt-6 px-5 py-5">
          <div className="tutor-section-head">
            <h2>Detalles del usuario</h2>
          </div>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
            <img
              src={TUTOR_AVATAR}
              alt=""
              className="h-[72px] w-[72px] shrink-0 rounded-full border border-tutor-rule bg-tutor-sunken object-cover"
            />

            <div className="min-w-0 flex-1">
              <h3 className="text-[22px] leading-tight text-tutor-ink">{displayName}</h3>
              <p className="mt-0.5 text-tutor-ink-soft">
                {groups.length} {groups.length === 1 ? 'salón' : 'salones'} · {totalStudents} niños
                a cargo
              </p>

              <dl className="tutor-stats mt-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <dt className="text-[13.5px] font-medium text-tutor-ink-soft">Correo</dt>
                  <dd className="mt-0.5 break-words font-semibold text-tutor-ink">
                    {email ?? <span className="text-tutor-ink-faint">Sin correo asociado</span>}
                  </dd>
                </div>

                <div>
                  <dt className="text-[13.5px] font-medium text-tutor-ink-soft">Rol</dt>
                  <dd className="mt-0.5 font-semibold text-tutor-ink">Tutor</dd>
                </div>
              </dl>

              <div className="mt-5">
                <ChangeNamePanel variant="tutor" />
                <ChangePasswordPanel variant="tutor" />
              </div>
              <DeleteAccountPanel variant="tutor" />
            </div>
          </div>
        </section>

        <section className="tutor-card mt-6 overflow-hidden">
          <div className="px-5 pt-5">
            <div className="tutor-section-head">
              <h2>Mis salones</h2>
              <span className="text-[14px] text-tutor-ink-soft">{groups.length}</span>
            </div>
          </div>

          <ul className="mt-2">
            {groups.map((group) => {
              const theme = getGroupTheme(group.id);

              return (
                <li
                  key={group.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-tutor-rule px-5 py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="h-[22px] w-[4px] shrink-0 rounded-full"
                      style={{ background: theme.color }}
                    />

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-tutor-ink" title={group.name}>
                        {group.name}
                      </p>
                      <p className="text-[14px] text-tutor-ink-soft">{group.gradeLabel}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[14px] text-tutor-ink-soft">
                      {group.students.length} de {group.capacity} niños
                    </span>

                    <button
                      type="button"
                      onClick={() => navigate(`${ROUTES.TEACHER_GROUPS}/${group.id}`)}
                      className="tutor-btn tutor-btn-secondary tutor-btn-sm"
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
