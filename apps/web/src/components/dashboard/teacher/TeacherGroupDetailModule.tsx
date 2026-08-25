import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useClassrooms } from '../../../hooks/useClassrooms';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { GroupBadge } from '../shared/GroupBadge';
import { getGroupTheme } from '../shared/groupThemes';
import { StatCard } from '../shared/StatCard';
import { StudentRosterTable } from '../shared/StudentRosterTable';
import { findClassGroup, getClassGroupStats } from './classroomsData';
import { InviteByEmailPanel } from './InviteByEmailPanel';
import { PendingRequestsSection } from './PendingRequestsSection';
import {
  BackIcon,
  InviteIcon,
  MedalIcon,
  ProgressIcon,
  PulseIcon,
  SeatIcon,
  StudentsIcon,
  TrashIcon,
} from './TeacherIcons';

interface TeacherGroupDetailModuleProps {
  groupId: string | undefined;
}

export const TeacherGroupDetailModule = ({ groupId }: TeacherGroupDetailModuleProps) => {
  const navigate = useNavigate();
  const { groups, acceptRequest, deleteGroup, inviteByEmail, rejectRequest, removeStudent } =
    useClassrooms();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const group = findClassGroup(groups, groupId);

  if (!group) {
    return (
      <div className="px-5 py-5">
        <section className="card px-6 py-12 text-center">
          <h1 className="title-lg">Ese salón ya no existe</h1>
          <p className="subtitle mt-2">
            Puede que lo hayas eliminado o que el enlace esté equivocado.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.TEACHER_GROUPS)}
            className="btn btn-grape mt-6"
          >
            Volver a mis salones
          </button>
        </section>
      </div>
    );
  }

  const stats = getClassGroupStats(group);
  const theme = getGroupTheme(group.id);
  const affectedStudents = group.students.length;
  const affectedRequests = group.pendingRequests.length;

  const handleDelete = () => {
    deleteGroup(group.id);
    setConfirmingDelete(false);
    navigate(ROUTES.TEACHER_GROUPS);
  };

  return (
    <div className="px-5 py-5">
      <button
        type="button"
        onClick={() => navigate(ROUTES.TEACHER_GROUPS)}
        className="mb-4 flex items-center gap-1.5 font-display text-[15px] text-grape-dark hover:underline"
      >
        <BackIcon />
        Mis salones
      </button>

      <section
        className="card relative overflow-hidden px-5 py-5"
        style={{ background: theme.gradient }}
      >
        <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/20" />
        <span className="pointer-events-none absolute right-24 top-10 h-12 w-12 rounded-full bg-white/15" />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <GroupBadge theme={theme} size={78} />

            <div>
              <h1 className="font-display text-[32px] leading-tight text-white drop-shadow-[0_2px_0_rgba(42,27,69,0.35)]">
                {group.name}
              </h1>
              <p className="text-[16px] font-bold text-white/90">
                {group.gradeLabel} · Profesor {group.teacherName}
              </p>
              <span className="mt-2 inline-flex rounded-full border-2 border-ink bg-white px-3 py-1 font-display text-[13px] tracking-[0.05em] text-ink">
                ID: {group.publicId}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setInviteOpen((open) => !open)}
              aria-expanded={inviteOpen}
              className="btn btn-sun"
            >
              <InviteIcon />
              Invitar
            </button>

            <button
              type="button"
              onClick={() => navigate(`${ROUTES.TEACHER_PANEL}/${group.id}`)}
              className="btn btn-mint"
            >
              <ProgressIcon />
              Ver progreso
            </button>

            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="btn btn-coral"
            >
              <TrashIcon />
              Eliminar salón
            </button>
          </div>
        </div>
      </section>

      {inviteOpen ? (
        <div className="mt-5">
          <InviteByEmailPanel
            group={group}
            freeSeats={stats.freeSeats}
            onInvite={(email) => inviteByEmail(group.id, email)}
          />
        </div>
      ) : null}

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<StudentsIcon />}
          title="Exploradores"
          value={String(stats.totalStudents)}
          tone="grape"
        />
        <StatCard
          icon={<MedalIcon />}
          title="Mundo más común"
          value={stats.averageWorldLabel}
          tone="mint"
        />
        <StatCard
          icon={<PulseIcon />}
          title="Activos hoy"
          value={`${stats.activeToday} de ${stats.totalStudents}`}
          tone="sun"
        />
        <StatCard
          icon={<SeatIcon />}
          title="Cupos libres"
          value={String(stats.freeSeats)}
          tone="sky"
        />
      </section>

      <div className="mt-6">
        <PendingRequestsSection
          group={group}
          freeSeats={stats.freeSeats}
          onAccept={(requestId) => acceptRequest(group.id, requestId)}
          onReject={(requestId) => rejectRequest(group.id, requestId)}
        />
      </div>

      <section className="mt-6 pb-4">
        <h2 className="title-lg mb-4">Seguimiento de los exploradores</h2>

        <StudentRosterTable
          students={group.students}
          onRemoveStudent={(studentId) => removeStudent(group.id, studentId)}
        />
      </section>

      {confirmingDelete ? (
        <ConfirmDialog
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

          <p className="mt-2 font-bold text-coral-dark">Esta acción no se puede deshacer.</p>
        </ConfirmDialog>
      ) : null}
    </div>
  );
};
