import routeX from '../../../assets/brand/route-x.webp';
import compassRose from '../../../assets/brand/classroom-compass.webp';
import pendingLeopard from '../../../assets/brand/classroom-pending-leopard-ink.webp';
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
import { LoadingLeo } from '../../ui/LoadingLeo';

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
        <LoadingLeo label="Cargando tu salón…" />
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

        {/* Un pergamino más del mapa: la solicitud viaja, todavía no hay salón que pintar. */}
        <section className="relative isolate mx-auto mt-4 max-w-[680px] px-14 pb-14 pt-12 text-center">
          <div aria-hidden className="map-sheet pointer-events-none absolute inset-0 -z-10" />

          <div className="flex flex-col items-center">
            {/* Un antetítulo entre dos tramos de ruta, no un sello más: ya hay dos en la tarjeta. */}
            <p className="mb-2 flex items-center gap-3 font-map text-[18px] uppercase tracking-[0.12em] text-sepia-soft">
              <span aria-hidden className="map-route-dashes h-[10px] w-10 opacity-70" />
              En espera
              <span aria-hidden className="map-route-dashes h-[10px] w-10 opacity-70" />
            </p>

            <h1 className="map-title font-display text-[32px] leading-tight text-sepia">
              Tu solicitud a {currentGroup.name} está en camino
            </h1>

            <img
              src={pendingLeopard}
              alt=""
              aria-hidden
              className="pointer-events-none mt-4 h-[180px] w-auto"
            />

            <p className="mt-4 max-w-[460px] font-map text-[19px] text-sepia-soft">
              El tutor {currentGroup.teacherName} tiene que aceptarte. En cuanto lo haga verás aquí
              a tus compañeros y podrás seguir su avance.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-7">
              <div className="flex items-center gap-3">
                <GroupBadge theme={theme} size={56} shape="seal" />
                <div className="text-left">
                  <p className="font-map text-[16px] text-sepia-soft">ID del salón</p>
                  <p className="rotate-[2deg] rounded-md border-[3px] border-double border-sepia px-2.5 font-map text-[20px] text-sepia">
                    {currentGroup.publicId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={cancelJoinRequest}
                className="rounded-md border-2 border-dashed border-sepia bg-wood-bare/70 px-6 py-1.5 font-map text-[20px] text-sepia transition-colors hover:bg-wood-bare"
              >
                Cancelar solicitud
              </button>
            </div>
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
