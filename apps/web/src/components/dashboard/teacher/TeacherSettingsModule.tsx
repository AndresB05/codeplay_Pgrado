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
import { LogoutIcon } from './TeacherIcons';

interface TeacherSettingsModuleProps {
  user: User | null;
  groups: ClassGroup[];
}

/* «Cerrar sesión» vive aquí y no en la barra lateral, como en el prototipo. */
export const TeacherSettingsModule = ({ user, groups }: TeacherSettingsModuleProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  /* Ver `Sidebar.tsx`: sin `signOut` la sesión de Supabase sobreviviría. */
  const handleLogout = async (): Promise<void> => {
    endGuestSession();
    await signOut();
    navigate(ROUTES.LANDING);
  };

  const displayName = user?.fullName || FALLBACK_TEACHER_NAME;
  const email = user?.email;
  const totalStudents = groups.reduce((total, group) => total + group.students.length, 0);

  return (
    <div className="px-6 py-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1160px]">
        <section>
          <h1 className="text-[26px] leading-tight text-tutor-ink">Mi cuenta</h1>
          <p className="mt-1 text-tutor-ink-soft">Tus datos, tu contraseña y tus salones.</p>
        </section>

        <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-3">
            <section aria-label="Tu perfil" className="tutor-card overflow-hidden text-center">
              <div aria-hidden className="h-[56px] bg-tutor-accent" />
              <img
                src={TUTOR_AVATAR}
                alt=""
                className="mx-auto -mt-[40px] h-[80px] w-[80px] rounded-full border-4 border-tutor-surface bg-tutor-sunken object-cover"
              />

              <h2 className="mt-2 break-words px-4 text-[20px] leading-tight text-tutor-ink">
                {displayName}
              </h2>
              <p className="mt-1.5">
                <span className="tutor-badge tutor-badge-ok tutor-badge-plain">Tutor</span>
              </p>
              <p className="mt-1.5 break-words px-4 text-[14px] text-tutor-ink-soft">
                {email ?? 'Sin correo asociado'}
              </p>

              {/* La cifra arriba y el rótulo debajo, pero en el orden de lectura va primero el rótulo. */}
              <dl className="mt-4 grid grid-cols-2 border-t border-tutor-rule">
                <div className="flex flex-col-reverse border-r border-tutor-rule px-3 py-3">
                  <dt className="text-[13px] text-tutor-ink-soft">
                    {groups.length === 1 ? 'salón' : 'salones'}
                  </dt>
                  <dd className="text-[22px] font-bold leading-tight text-tutor-ink">
                    {groups.length}
                  </dd>
                </div>
                <div className="flex flex-col-reverse px-3 py-3">
                  <dt className="text-[13px] text-tutor-ink-soft">niños a cargo</dt>
                  <dd className="text-[22px] font-bold leading-tight text-tutor-ink">
                    {totalStudents}
                  </dd>
                </div>
              </dl>
            </section>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="tutor-btn tutor-btn-secondary w-full text-tutor-danger"
            >
              <LogoutIcon variant="tutor" />
              Cerrar sesión
            </button>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <section className="tutor-card px-5 pb-1 pt-4">
              <h2 className="text-[17px] leading-tight text-tutor-ink">Datos de la cuenta</h2>

              <div className="mt-2">
                <ChangeNamePanel variant="tutor" />

                <div className="border-t border-tutor-rule py-3.5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <h3 className="w-[120px] shrink-0 font-tutor text-[14.5px] font-semibold text-tutor-ink">
                      Correo
                    </h3>
                    <span className="min-w-0 flex-1 truncate text-tutor-ink-soft">
                      {email ?? 'Sin correo asociado'}
                    </span>
                  </div>
                </div>

                <ChangePasswordPanel variant="tutor" />
              </div>
            </section>

            <section className="tutor-card overflow-hidden">
              <header className="flex items-center gap-2.5 border-b border-tutor-rule px-5 py-3.5">
                <h2 className="text-[17px] leading-tight text-tutor-ink">Mis salones</h2>
                <span className="tutor-badge tutor-badge-mute tutor-badge-plain">
                  {groups.length}
                </span>
              </header>

              {groups.length === 0 ? (
                <p className="px-5 py-6 text-center text-tutor-ink-soft">
                  Todavía no tienes ningún salón.
                </p>
              ) : (
                /* Con diez salones la lista empujaba «Eliminar cuenta» fuera de la vista. */
                <ul className="max-h-[360px] overflow-y-auto overscroll-contain">
                  {groups.map((group) => {
                    const theme = getGroupTheme(group.id);
                    const members = group.students.length;
                    const fill = group.capacity > 0 ? Math.min(members / group.capacity, 1) : 0;

                    return (
                      <li
                        key={group.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-tutor-rule px-5 py-3 last:border-b-0"
                      >
                        <span
                          aria-hidden
                          className="h-[30px] w-[4px] shrink-0 rounded-full"
                          style={{ background: theme.color }}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-tutor-ink" title={group.name}>
                            {group.name}
                          </p>
                          <p className="text-[13.5px] text-tutor-ink-soft">
                            {group.gradeLabel} · ID {group.publicId}
                          </p>
                        </div>

                        <div className="w-[160px]">
                          <p className="flex justify-between text-[13.5px] text-tutor-ink-soft">
                            <span>
                              {members} de {group.capacity} niños
                            </span>
                            <span>{Math.round(fill * 100)}%</span>
                          </p>
                          <span
                            aria-hidden
                            className="mt-1 block h-[4px] overflow-hidden rounded-full bg-tutor-rule"
                          >
                            <span
                              className="block h-full rounded-full"
                              style={{ width: `${fill * 100}%`, background: theme.color }}
                            />
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(`${ROUTES.TEACHER_GROUPS}/${group.id}`)}
                          aria-label={`Abrir ${group.name}`}
                          className="tutor-btn tutor-btn-secondary tutor-btn-sm"
                        >
                          Abrir
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <DeleteAccountPanel variant="tutor" />
          </div>
        </div>
      </div>
    </div>
  );
};
