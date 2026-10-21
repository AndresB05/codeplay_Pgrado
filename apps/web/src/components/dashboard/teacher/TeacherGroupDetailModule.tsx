import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useClassrooms } from '../../../hooks/useClassrooms';
import { useFreshClassrooms } from '../../../hooks/useFreshClassrooms';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { GroupBadge } from '../shared/GroupBadge';
import { getGroupTheme } from '../shared/groupThemes';
import { ChevronIcon } from '../shared/RosterFilterBar';
import { StatCard } from '../shared/StatCard';
import { StoreErrorNotice } from '../shared/StoreErrorNotice';
import { ClassroomPodium } from '../shared/ClassroomPodium';
import { podiumRanking } from '../shared/podiumRanking';
import { StudentRosterTable } from '../shared/StudentRosterTable';
import { findClassGroup, getClassGroupStats, inactiveStudents, sortGroups } from './classroomsData';
import { AttentionSection } from './AttentionSection';
import { AddStudentsPanel } from './AddStudentsPanel';
import { ExportReportMenu } from './ExportReportMenu';
import { PendingRequestsSection } from './PendingRequestsSection';
import { BackIcon, InviteIcon, ProgressIcon, TrashIcon } from './TeacherIcons';

interface TeacherGroupDetailModuleProps {
  groupId: string | undefined;
}

/*
 * La ruta de otro salón monta el mismo componente con otro `groupId`, y React lo
 * reutilizaría: los filtros del roster o el panel de sumar alumnos pasarían de un
 * salón al siguiente. La `key` lo obliga a empezar de cero.
 */
export const TeacherGroupDetailModule = ({ groupId }: TeacherGroupDetailModuleProps) => (
  <GroupDetail key={groupId ?? ''} groupId={groupId} />
);

const GroupDetail = ({ groupId }: TeacherGroupDetailModuleProps) => {
  const navigate = useNavigate();
  const {
    groups,
    acceptRequest,
    deleteGroup,
    error,
    onlineStudentIds,
    rejectRequest,
    removeStudent,
  } = useClassrooms();

  /* Antes de cualquier `return`: esta pantalla tiene varios y son condicionales. */
  useFreshClassrooms();
  const [addStudentsOpen, setAddStudentsOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  /*
   * Nadie restaura el scroll al navegar: sin esto, el salón nuevo se abre a media
   * altura. `instant` porque el `html` lleva `scroll-behavior: smooth`, y subir
   * animando parecería un desplazamiento dentro del mismo salón.
   */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const group = findClassGroup(groups, groupId);

  if (!group) {
    return (
      <div className="px-6 py-6 lg:px-8">
        <section className="tutor-card mx-auto w-full max-w-[1160px] px-6 py-12 text-center">
          <h1 className="text-[22px] leading-tight text-tutor-ink">Ese salón ya no existe</h1>
          <p className="mt-2 text-tutor-ink-soft">
            Puede que lo hayas eliminado o que el enlace esté equivocado.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.TEACHER_GROUPS)}
            className="tutor-btn tutor-btn-primary mt-5"
          >
            Volver a mis salones
          </button>
        </section>
      </div>
    );
  }

  const stats = getClassGroupStats(group, onlineStudentIds);
  const theme = getGroupTheme(group.id);
  const affectedStudents = group.students.length;
  const affectedRequests = group.pendingRequests.length;

  const handleDelete = () => {
    deleteGroup(group.id);
    setConfirmingDelete(false);
    navigate(ROUTES.TEACHER_GROUPS);
  };

  /* El podio sólo existe si alguien ha ganado XP. */
  const hasPodium = podiumRanking(group.students).length > 0;

  return (
    <div className="px-6 py-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1160px]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => navigate(ROUTES.TEACHER_GROUPS)}
            className="tutor-focus inline-flex items-center gap-1 rounded-[6px] text-[14.5px] font-semibold text-tutor-accent hover:underline"
          >
            <BackIcon variant="tutor" />
            Mis salones
          </button>

          {groups.length > 1 ? (
            <label className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-2.5">
              <span className="text-[13.5px] font-medium text-tutor-ink-soft sm:shrink-0">
                Ir a otro salón
              </span>
              <span className="relative block sm:w-[260px]">
                <select
                  value={group.id}
                  onChange={(event) => navigate(`${ROUTES.TEACHER_GROUPS}/${event.target.value}`)}
                  className="tutor-field appearance-none pr-9"
                >
                  {sortGroups(groups, 'name').map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} · {option.memberCount}{' '}
                      {option.memberCount === 1 ? 'alumno' : 'alumnos'}
                    </option>
                  ))}
                </select>
                <ChevronIcon variant="tutor" />
              </span>
            </label>
          ) : null}
        </div>

        <StoreErrorNotice error={error} variant="tutor" />

        {/*
         * La pestaña de la carpeta es el borde izquierdo de la tarjeta y no una
         * franja recortada: sin overflow-hidden, el menú de exportar puede salir.
         */}
        <section
          className="tutor-card relative z-10 border-l-[6px] px-5 py-4"
          style={{ borderLeftColor: theme.color }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3.5">
              <GroupBadge theme={theme} size={48} shape="plain" />

              <div className="min-w-0">
                <h1 className="text-[24px] leading-tight text-tutor-ink">{group.name}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-tutor-ink-soft">
                  <span>
                    {group.gradeLabel} · Tutor{' '}
                    <span className="font-semibold text-tutor-ink">{group.teacherName}</span>
                  </span>
                  <span className="rounded-[6px] border border-tutor-rule-strong px-2 py-0.5 text-[13px] font-semibold tracking-[0.04em] text-tutor-ink">
                    ID: {group.publicId}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-2">
              <button
                type="button"
                onClick={() => setAddStudentsOpen((open) => !open)}
                aria-expanded={addStudentsOpen}
                className="tutor-btn tutor-btn-primary"
              >
                <InviteIcon variant="tutor" />
                Sumar alumnos
              </button>

              <button
                type="button"
                onClick={() => navigate(`${ROUTES.TEACHER_PANEL}/${group.id}`)}
                className="tutor-btn tutor-btn-secondary"
              >
                <ProgressIcon variant="tutor" />
                Ver progreso
              </button>

              <ExportReportMenu group={group} />

              {/* Aparte y sin relleno: no puede quedar a mano de «Sumar alumnos» y pulsarse por inercia. */}
              <span aria-hidden className="mx-1 h-[36px] w-px bg-tutor-rule max-sm:hidden" />

              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="tutor-btn tutor-btn-ghost-danger"
              >
                <TrashIcon variant="tutor" />
                Eliminar salón
              </button>
            </div>
          </div>
        </section>

        {addStudentsOpen ? (
          <div className="mt-4">
            <AddStudentsPanel group={group} freeSeats={stats.freeSeats} />
          </div>
        ) : null}

        {/*
         * A la izquierda, lo que pide hacer algo —quién se descuelga y quién
         * espera entrar—; a la derecha, lo que sólo se mira.
         */}
        <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-4">
            <AttentionSection
              students={inactiveStudents(group.students, onlineStudentIds)}
              onOpen={(studentId) => navigate(`${ROUTES.TEACHER_PANEL}/${group.id}/${studentId}`)}
            />

            <PendingRequestsSection
              group={group}
              freeSeats={stats.freeSeats}
              onAccept={(requestId) => acceptRequest(group.id, requestId)}
              onReject={(requestId) => rejectRequest(group.id, requestId)}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <dl className="tutor-stats grid-cols-2">
              <StatCard title="Exploradores" value={String(stats.totalStudents)} variant="tutor" />
              <StatCard
                title="Conectados ahora"
                value={`${stats.connectedNow} de ${stats.totalStudents}`}
                variant="tutor"
              />
              <StatCard title="Mundo más común" value={stats.averageWorldLabel} variant="tutor" />
              <StatCard title="Cupos libres" value={String(stats.freeSeats)} variant="tutor" />
            </dl>

            {hasPodium ? <ClassroomPodium students={group.students} variant="tutor" /> : null}
          </div>
        </div>

        <section className="mt-8 pb-4">
          <div className="tutor-section-head">
            <h2>Seguimiento de los exploradores</h2>
            <span className="text-[14px] text-tutor-ink-soft">{group.students.length}</span>
          </div>

          <div className="mt-3">
            <StudentRosterTable
              students={group.students}
              onlineIds={onlineStudentIds}
              onRemoveStudent={(studentId) => removeStudent(group.id, studentId)}
              onOpenStudent={(studentId) =>
                navigate(`${ROUTES.TEACHER_PANEL}/${group.id}/${studentId}`)
              }
              variant="tutor"
            />
          </div>
        </section>
      </div>

      {confirmingDelete ? (
        <ConfirmDialog
          variant="tutor"
          title={`¿Eliminar ${group.name}?`}
          confirmLabel="Sí, eliminar"
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        >
          <p>
            {affectedStudents === 0
              ? 'Este salón no tiene exploradores inscritos.'
              : `${affectedStudents} explorador${affectedStudents === 1 ? '' : 'es'} ${
                  affectedStudents === 1 ? 'quedará' : 'quedarán'
                } sin salón y ${affectedStudents === 1 ? 'volverá' : 'volverán'} al buscador para pedir entrar a otro.`}
          </p>

          {affectedRequests > 0 ? (
            <p className="mt-2">
              También se descartará{affectedRequests === 1 ? '' : 'n'} {affectedRequests} solicitud
              {affectedRequests === 1 ? '' : 'es'} de ingreso pendiente
              {affectedRequests === 1 ? '' : 's'}.
            </p>
          ) : null}

          <p className="mt-2 font-semibold text-tutor-danger">Esta acción no se puede deshacer.</p>
        </ConfirmDialog>
      ) : null}
    </div>
  );
};
