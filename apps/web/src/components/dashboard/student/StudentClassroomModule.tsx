import routeX from '../../../assets/brand/route-x.webp';
import compassRose from '../../../assets/brand/classroom-compass.webp';
import { useClassrooms } from '../../../hooks/useClassrooms';
import { useFreshClassrooms } from '../../../hooks/useFreshClassrooms';
import { AssignedMissionsPanel } from '../shared/AssignedMissionsPanel';
import { GroupBadge } from '../shared/GroupBadge';
import { getGroupTheme } from '../shared/groupThemes';
import { StatCard } from '../shared/StatCard';
import { StoreErrorNotice } from '../shared/StoreErrorNotice';
import { ClassroomPodium } from '../shared/ClassroomPodium';
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
  const {
    groups,
    membership,
    currentGroup,
    error,
    loading,
    onlineStudentIds,
    requestJoin,
    cancelJoinRequest,
  } = useClassrooms();

  /* Antes de cualquier `return`: esta pantalla tiene varios y son condicionales. */
  useFreshClassrooms();

  /*
   * Mientras se consulta, la pertenencia todavía es `none`: pintar el buscador
   * sería decirle que no tiene salón a un niño que sí lo tiene.
   */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-[5px] border-line border-t-grape" />
      </div>
    );
  }

  if (membership.status === 'none' || !currentGroup) {
    return (
      <>
        {error ? (
          <div className="px-5 pt-5">
            <StoreErrorNotice error={error} />
          </div>
        ) : null}

        <StudentClassroomSearch groups={groups} onRequestJoin={requestJoin} />
      </>
    );
  }

  const theme = getGroupTheme(currentGroup.id);

  if (membership.status === 'pending') {
    return (
      <div className="px-5 py-5">
        <StoreErrorNotice error={error} />

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
              El tutor {currentGroup.teacherName} tiene que aceptarte. En cuanto lo haga verás aquí
              a tus compañeros y podrás seguir su avance.
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
      <StoreErrorNotice error={error} />

      {/*
       * El salón entero es un mapa: la cabecera es la cartela del título, con el
       * color y la insignia que eligió el tutor en un sello de tinta.
       */}
      <section className="relative isolate flex flex-wrap items-center gap-5 px-16 py-7">
        <div
          aria-hidden
          className="classroom-cartouche pointer-events-none absolute inset-0 -z-10"
        />

        <GroupBadge theme={theme} size={72} shape="seal" />

        <div className="relative min-w-0">
          <h1 className="map-title font-display text-[34px] leading-tight text-sepia">
            {/* La ruta punteada con su X subraya el nombre y se estira con él. */}
            <span className="inline-flex max-w-full flex-col">
              {currentGroup.name}
              <span aria-hidden className="mt-0.5 flex h-[14px] items-center">
                <span className="map-route-dashes h-full flex-1" />
                <img src={routeX} alt="" className="h-[14px] w-auto" />
              </span>
            </span>
          </h1>
          <p className="font-map text-[19px] text-sepia-soft">
            Tutor {currentGroup.teacherName} · {currentGroup.students.length}{' '}
            {currentGroup.students.length === 1 ? 'explorador' : 'exploradores'}
          </p>
        </div>

        <img
          src={compassRose}
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-[84px] top-1/2 hidden h-[80px] w-[80px] -translate-y-1/2 opacity-45 md:block"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:max-w-[760px] lg:grid-cols-2">
        <StatCard
          icon={<StudentsIcon />}
          title="Compañeros"
          value={String(stats.totalStudents)}
          tone="grape"
          variant="map"
        />
        <StatCard
          icon={<MedalIcon />}
          title="Mundo del salón"
          value={stats.averageWorldLabel}
          tone="mint"
          variant="map"
        />
      </section>

      <ClassroomPodium students={currentGroup.students} variant="map" />

      <section className="mt-6">
        <StudentRosterTable
          students={currentGroup.students}
          onlineIds={onlineStudentIds}
          variant="map"
        />
      </section>

      {/*
       * Al final, pedido por el usuario: las misiones van y vienen, mientras
       * que compañeros y podio están siempre, y son lo que se viene a mirar.
       */}
      <div className="pb-4">
        <AssignedMissionsPanel onMap />
      </div>
    </div>
  );
};
