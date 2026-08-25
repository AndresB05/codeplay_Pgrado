import { useClassrooms } from '../../../hooks/useClassrooms';
import { GroupBadge } from '../shared/GroupBadge';
import { getGroupTheme } from '../shared/groupThemes';
import { StatCard } from '../shared/StatCard';
import { StudentRosterTable } from '../shared/StudentRosterTable';
import { getClassGroupStats } from '../teacher/classroomsData';
import { MedalIcon, StudentsIcon } from '../teacher/TeacherIcons';
import { StudentClassroomSearch } from './StudentClassroomSearch';

const HourglassIcon = () => (
  <svg width="74" height="74" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8H46M18 56H46" stroke="#2A1B45" strokeWidth="4" strokeLinecap="round" />
    <path
      d="M22 8V18C22 26 32 30 32 32C32 34 22 38 22 46V56H42V46C42 38 32 34 32 32C32 30 42 26 42 18V8"
      fill="#FFF9EF"
      stroke="#2A1B45"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path d="M27 46C27 42 32 39 32 39C32 39 37 42 37 46H27Z" fill="#FFC93C" />
    <circle cx="32" cy="20" r="3" fill="#FFC93C" />
  </svg>
);

/**
 * Salón desde la cuenta del niño. Tiene tres estados: sin salón (buscador),
 * en espera de respuesta del tutor, e inscrito (ve a sus compañeros).
 */
export const StudentClassroomModule = () => {
  const { groups, membership, currentGroup, requestJoin, cancelJoinRequest } = useClassrooms();

  if (membership.status === 'none' || !currentGroup) {
    return <StudentClassroomSearch groups={groups} onRequestJoin={requestJoin} />;
  }

  const theme = getGroupTheme(currentGroup.id);

  if (membership.status === 'pending') {
    return (
      <div className="px-5 py-5">
        <section className="card relative mx-auto mt-4 max-w-[680px] overflow-hidden px-8 py-10 text-center">
          <span className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-sun-soft" />
          <span className="pointer-events-none absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-grape-soft" />

          <div className="relative flex flex-col items-center">
            <HourglassIcon />

            <span className="mt-4 rounded-full border-2 border-ink bg-sun px-5 py-1.5 font-display text-[16px] text-ink">
              En espera
            </span>

            <h1 className="title-xl mt-4">Tu solicitud a {currentGroup.name} está en camino</h1>

            <p className="subtitle mt-3 max-w-[460px]">
              El profesor {currentGroup.teacherName} tiene que aceptarte. En cuanto lo haga verás
              aquí a tus compañeros y podrás seguir su avance.
            </p>

            <div className="mt-5 flex items-center gap-3 rounded-[20px] border-2 border-line bg-cream px-4 py-3">
              <GroupBadge theme={theme} size={48} />
              <div className="text-left">
                <p className="text-[14px] font-bold uppercase tracking-[0.05em] text-ink-faint">
                  ID del salón
                </p>
                <p className="font-display text-[18px] text-mint-dark">{currentGroup.publicId}</p>
              </div>
            </div>

            <button type="button" onClick={cancelJoinRequest} className="btn btn-ghost mt-7">
              Cancelar solicitud
            </button>
          </div>
        </section>
      </div>
    );
  }

  const stats = getClassGroupStats(currentGroup);

  return (
    <div className="px-5 py-5">
      <section
        className="card relative flex flex-wrap items-center gap-4 overflow-hidden px-5 py-5"
        style={{ background: theme.gradient }}
      >
        <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/20" />

        <GroupBadge theme={theme} size={72} />

        <div className="relative">
          <h1 className="font-display text-[30px] leading-tight text-white drop-shadow-[0_2px_0_rgba(42,27,69,0.35)]">
            {currentGroup.name}
          </h1>
          <p className="text-[16px] font-bold text-white/90">Profesor {currentGroup.teacherName}</p>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:max-w-[760px] lg:grid-cols-2">
        <StatCard
          icon={<StudentsIcon />}
          title="Compañeros"
          value={String(stats.totalStudents)}
          tone="grape"
        />
        <StatCard
          icon={<MedalIcon />}
          title="Mundo del salón"
          value={stats.averageWorldLabel}
          tone="mint"
        />
      </section>

      <section className="mt-6 pb-4">
        <StudentRosterTable students={currentGroup.students} />
      </section>
    </div>
  );
};
