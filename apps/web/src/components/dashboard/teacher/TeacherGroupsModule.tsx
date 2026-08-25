import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useClassrooms } from '../../../hooks/useClassrooms';
import type { ClassGroup, CreateGroupInput } from '../../../types/classroom.types';
import { GroupBadge } from '../shared/GroupBadge';
import { getGroupTheme } from '../shared/groupThemes';
import { StatCard } from '../shared/StatCard';
import { getClassGroupStats } from './classroomsData';
import { CreateGroupForm } from './CreateGroupForm';
import { PulseIcon, SeatIcon, StudentsIcon } from './TeacherIcons';

interface TeacherGroupsModuleProps {
  groups: ClassGroup[];
  /** Nombre por defecto del profesor a cargo al crear un salón. */
  teacherName: string;
}

export const TeacherGroupsModule = ({ groups, teacherName }: TeacherGroupsModuleProps) => {
  const navigate = useNavigate();
  const { createGroup } = useClassrooms();
  const [creating, setCreating] = useState(false);

  const totalStudents = groups.reduce((total, group) => total + group.students.length, 0);

  const totalActiveToday = groups.reduce(
    (total, group) => total + getClassGroupStats(group).activeToday,
    0
  );

  const totalFreeSeats = groups.reduce(
    (total, group) => total + getClassGroupStats(group).freeSeats,
    0
  );

  const totalPending = groups.reduce((total, group) => total + group.pendingRequests.length, 0);

  const handleCreate = (input: CreateGroupInput) => {
    const created = createGroup(input);

    setCreating(false);
    navigate(`${ROUTES.TEACHER_GROUPS}/${created.id}`);
  };

  return (
    <div className="px-5 py-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="title-xl">Mis salones</h1>
          <p className="subtitle mt-1">
            Administra tus grupos de clase y sigue el avance de cada explorador.
          </p>
        </div>

        {!creating ? (
          <button type="button" onClick={() => setCreating(true)} className="btn btn-grape">
            <span className="text-[22px] leading-none">+</span>
            Crear salón
          </button>
        ) : null}
      </section>

      {creating ? (
        <div className="mt-5">
          <CreateGroupForm
            defaultTeacherName={teacherName}
            onCreate={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      ) : null}

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={<StudentsIcon />}
          title="Exploradores"
          value={String(totalStudents)}
          tone="grape"
        />
        <StatCard
          icon={<PulseIcon />}
          title="Activos hoy"
          value={`${totalActiveToday} de ${totalStudents}`}
          tone="sun"
        />
        <StatCard
          icon={<SeatIcon />}
          title="Cupos libres"
          value={String(totalFreeSeats)}
          tone="sky"
        />
      </section>

      <section className="mt-8 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="title-lg">Grupos de clase</h2>

          {totalPending > 0 ? (
            <span className="chip chip-sun">{totalPending} en espera</span>
          ) : null}
        </div>

        {groups.length === 0 ? (
          <p className="card mt-4 px-5 py-10 text-center text-[16px] font-semibold text-ink-faint">
            Todavía no administras ningún salón. Crea el primero con el botón de arriba.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {groups.map((group) => {
              const stats = getClassGroupStats(group);
              const pending = group.pendingRequests.length;
              const theme = getGroupTheme(group.id);

              return (
                <article key={group.id} className="card overflow-hidden">
                  <div
                    className="relative flex items-center gap-4 border-b-[3px] border-ink px-5 py-4"
                    style={{ background: theme.gradient }}
                  >
                    {/* Burbujas decorativas de la cabecera */}
                    <span className="pointer-events-none absolute -right-4 -top-6 h-20 w-20 rounded-full bg-white/25" />
                    <span className="pointer-events-none absolute right-14 top-8 h-8 w-8 rounded-full bg-white/20" />

                    <GroupBadge theme={theme} />

                    <div className="relative min-w-0">
                      <h3 className="font-display text-[24px] leading-tight text-white drop-shadow-[0_2px_0_rgba(42,27,69,0.35)]">
                        {group.name}
                      </h3>
                      <p className="text-[15px] font-bold text-white/90">{group.gradeLabel}</p>
                    </div>

                    <span className="relative ml-auto shrink-0 rounded-full border-2 border-ink bg-white px-3 py-1 font-display text-[13px] tracking-[0.04em] text-ink">
                      {group.publicId}
                    </span>
                  </div>

                  <div className="px-5 py-4">
                    {pending > 0 ? (
                      <p className="mb-4 rounded-[16px] border-2 border-sun-dark bg-sun-soft px-4 py-2 text-[15px] font-bold text-sun-dark">
                        {pending} explorador{pending === 1 ? '' : 'es'} esperando tu respuesta
                      </p>
                    ) : null}

                    <dl className="grid grid-cols-3 gap-3">
                      <div className="rounded-[16px] border-2 border-line bg-cream px-3 py-2 text-center">
                        <dt className="text-[12px] font-bold uppercase tracking-[0.04em] text-ink-faint">
                          Niños
                        </dt>
                        <dd className="font-display text-[20px] text-ink">
                          {stats.totalStudents}/{group.capacity}
                        </dd>
                      </div>
                      <div className="rounded-[16px] border-2 border-line bg-cream px-3 py-2 text-center">
                        <dt className="text-[12px] font-bold uppercase tracking-[0.04em] text-ink-faint">
                          Activos
                        </dt>
                        <dd className="font-display text-[20px] text-mint-dark">
                          {stats.activeToday}
                        </dd>
                      </div>
                      <div className="rounded-[16px] border-2 border-line bg-cream px-3 py-2 text-center">
                        <dt className="text-[12px] font-bold uppercase tracking-[0.04em] text-ink-faint">
                          Racha top
                        </dt>
                        <dd className="font-display text-[20px] text-sun-dark">
                          {stats.bestStreak}
                        </dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      onClick={() => navigate(`${ROUTES.TEACHER_GROUPS}/${group.id}`)}
                      className="btn btn-grape mt-4 w-full"
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
  );
};
