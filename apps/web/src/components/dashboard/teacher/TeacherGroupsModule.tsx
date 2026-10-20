import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useClassrooms } from '../../../hooks/useClassrooms';
import type { ClassGroup, CreateGroupInput } from '../../../types/classroom.types';
import { GroupBadge } from '../shared/GroupBadge';
import { getGroupTheme } from '../shared/groupThemes';
import { StatCard } from '../shared/StatCard';
import { StoreErrorNotice } from '../shared/StoreErrorNotice';
import { getClassGroupStats } from './classroomsData';
import { CreateGroupForm } from './CreateGroupForm';

interface TeacherGroupsModuleProps {
  groups: ClassGroup[];
  /** Nombre por defecto del tutor a cargo al crear un salón. */
  teacherName: string;
}

export const TeacherGroupsModule = ({ groups, teacherName }: TeacherGroupsModuleProps) => {
  const navigate = useNavigate();
  const { createGroup, error, onlineStudentIds } = useClassrooms();
  const [creating, setCreating] = useState(false);

  const totalStudents = groups.reduce((total, group) => total + group.students.length, 0);

  // Un niño está en un solo salón: sumar salones no lo cuenta dos veces.
  const totalConnected = groups.reduce(
    (total, group) => total + getClassGroupStats(group, onlineStudentIds).connectedNow,
    0
  );

  const totalFreeSeats = groups.reduce(
    (total, group) => total + getClassGroupStats(group).freeSeats,
    0
  );

  const totalPending = groups.reduce((total, group) => total + group.pendingRequests.length, 0);

  const handleCreate = async (input: CreateGroupInput) => {
    const created = await createGroup(input);

    if (!created) {
      return;
    }

    setCreating(false);
    navigate(`${ROUTES.TEACHER_GROUPS}/${created.id}`);
  };

  return (
    <div className="tutor-scope px-6 py-6 lg:px-8">
      <div className="max-w-[1160px]">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] leading-tight text-tutor-ink">Mis salones</h1>
            <p className="mt-1 text-tutor-ink-soft">
              Administra tus grupos de clase y sigue el avance de cada explorador.
            </p>
          </div>

          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="tutor-btn tutor-btn-primary"
            >
              <span aria-hidden="true" className="text-[18px] leading-none">
                +
              </span>
              Crear salón
            </button>
          ) : null}
        </section>

        <div className="mt-5">
          <StoreErrorNotice error={error} variant="tutor" />
        </div>

        {creating ? (
          <div className="mb-5">
            <CreateGroupForm
              defaultTeacherName={teacherName}
              onCreate={handleCreate}
              onCancel={() => setCreating(false)}
            />
          </div>
        ) : null}

        <dl className="tutor-stats grid-cols-1 sm:grid-cols-3">
          <StatCard title="Exploradores" value={String(totalStudents)} variant="tutor" />
          <StatCard
            title="Conectados ahora"
            value={`${totalConnected} de ${totalStudents}`}
            variant="tutor"
          />
          <StatCard title="Cupos libres" value={String(totalFreeSeats)} variant="tutor" />
        </dl>

        <section className="mt-8 pb-4">
          <div className="tutor-section-head">
            <h2>Grupos de clase</h2>
            <span className="text-[14px] text-tutor-ink-soft">{groups.length}</span>

            {totalPending > 0 ? (
              <span className="tutor-badge tutor-badge-warn">{totalPending} en espera</span>
            ) : null}
          </div>

          {groups.length === 0 ? (
            <p className="tutor-card mt-4 px-5 py-10 text-center text-tutor-ink-soft">
              Todavía no administras ningún salón. Crea el primero con el botón de arriba.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {groups.map((group) => {
                const stats = getClassGroupStats(group, onlineStudentIds);
                const pending = group.pendingRequests.length;
                const theme = getGroupTheme(group.id);

                return (
                  <article key={group.id} className="tutor-card flex overflow-hidden">
                    {/* La pestaña de la carpeta: el color del salón vive aquí y en la barra lateral. */}
                    <span
                      aria-hidden
                      className="w-[6px] shrink-0"
                      style={{ background: theme.color }}
                    />

                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex items-center gap-3">
                        <GroupBadge theme={theme} size={44} shape="plain" />

                        <div className="min-w-0 flex-1">
                          <h3
                            title={group.name}
                            className="truncate text-[19px] leading-tight text-tutor-ink"
                          >
                            {group.name}
                          </h3>
                          <p className="text-[14px] text-tutor-ink-soft">{group.gradeLabel}</p>
                        </div>

                        <span className="shrink-0 rounded-[6px] border border-tutor-rule-strong px-2 py-0.5 text-[13px] font-semibold tracking-[0.04em] text-tutor-ink">
                          {group.publicId}
                        </span>
                      </div>

                      {pending > 0 ? (
                        <p className="mt-3">
                          <span className="tutor-badge tutor-badge-warn">
                            {pending} explorador{pending === 1 ? '' : 'es'} esperando tu respuesta
                          </span>
                        </p>
                      ) : null}

                      <dl className="tutor-stats mt-3 grid-cols-3 [&>*]:px-3 [&>*]:py-2">
                        <StatCard
                          title="Niños"
                          value={`${stats.totalStudents} de ${group.capacity}`}
                          variant="tutor"
                        />
                        <StatCard
                          title="Conectados"
                          value={String(stats.connectedNow)}
                          variant="tutor"
                        />
                        <StatCard
                          title="Racha top"
                          value={String(stats.bestStreak)}
                          variant="tutor"
                        />
                      </dl>

                      <button
                        type="button"
                        onClick={() => navigate(`${ROUTES.TEACHER_GROUPS}/${group.id}`)}
                        className="tutor-btn tutor-btn-secondary mt-3 w-full"
                      >
                        Ver salón
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
