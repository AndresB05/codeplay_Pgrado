import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useClassrooms } from '../../../hooks/useClassrooms';
import { useMinWidth } from '../../../hooks/useMinWidth';
import { useTeacherGroupsView } from '../../../hooks/useTeacherGroupsView';
import type { ClassGroup, CreateGroupInput } from '../../../types/classroom.types';
import { GroupBadge } from '../shared/GroupBadge';
import { getGroupTheme } from '../shared/groupThemes';
import { FilterSelect } from '../shared/RosterFilterBar';
import { StatCard } from '../shared/StatCard';
import { StoreErrorNotice } from '../shared/StoreErrorNotice';
import {
  GROUP_SEARCH_THRESHOLD,
  getClassGroupStats,
  searchGroups,
  sortGroups,
  type GroupSortKey,
} from './classroomsData';
import { CreateGroupForm } from './CreateGroupForm';

interface TeacherGroupsModuleProps {
  groups: ClassGroup[];
  /** Nombre por defecto del tutor a cargo al crear un salón. */
  teacherName: string;
}

const SORT_OPTIONS: { value: GroupSortKey; label: string }[] = [
  { value: 'name', label: 'Nombre' },
  { value: 'pending', label: 'Solicitudes' },
  { value: 'occupancy', label: 'Ocupación' },
  { value: 'online', label: 'Conectados' },
];

/* `md` de Tailwind: por debajo, la tabla no cabe y se fuerza la vista de tarjetas. */
const LIST_MIN_WIDTH = 768;

const GroupCard = ({
  group,
  onlineStudentIds,
  onOpen,
}: {
  group: ClassGroup;
  onlineStudentIds: ReadonlySet<string>;
  onOpen: () => void;
}) => {
  const stats = getClassGroupStats(group, onlineStudentIds);
  const pending = group.pendingRequests.length;
  const theme = getGroupTheme(group.id);

  return (
    <article className="tutor-card flex overflow-hidden">
      {/* La pestaña de la carpeta: el color del salón vive aquí y en la barra lateral. */}
      <span aria-hidden className="w-[6px] shrink-0" style={{ background: theme.color }} />

      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-center gap-3">
          <GroupBadge theme={theme} size={44} shape="plain" />

          <div className="min-w-0 flex-1">
            <h3 title={group.name} className="truncate text-[19px] leading-tight text-tutor-ink">
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
            <span className="tutor-badge tutor-badge-warn max-w-full max-sm:whitespace-normal">
              {pending} explorador{pending === 1 ? '' : 'es'} esperando tu respuesta
            </span>
          </p>
        ) : null}

        <dl className="tutor-stats mt-3 grid-cols-1 sm:grid-cols-3 [&>*]:px-3 [&>*]:py-2">
          <StatCard
            title="Niños"
            value={`${stats.totalStudents} de ${group.capacity}`}
            variant="tutor"
          />
          <StatCard title="Conectados" value={String(stats.connectedNow)} variant="tutor" />
          <StatCard title="Racha top" value={String(stats.bestStreak)} variant="tutor" />
        </dl>

        <button
          type="button"
          onClick={onOpen}
          className="tutor-btn tutor-btn-secondary mt-3 w-full"
        >
          Ver salón
        </button>
      </div>
    </article>
  );
};

/**
 * La tabla de salones, para quien tiene muchos: una fila por salón con lo que
 * ya se sabe de él —ocupación, conectados y solicitudes—, y nada inventado.
 */
const GroupsTable = ({
  groups,
  onlineStudentIds,
  onOpen,
}: {
  groups: ClassGroup[];
  onlineStudentIds: ReadonlySet<string>;
  onOpen: (groupId: string) => void;
}) => (
  <div className="tutor-card mt-3 overflow-x-auto">
    <table className="tutor-table min-w-[720px]">
      <thead>
        <tr>
          <th scope="col" className="w-[6px] !px-0">
            <span className="sr-only">Color</span>
          </th>
          <th scope="col">Salón</th>
          <th scope="col">ID</th>
          <th scope="col">Ocupación</th>
          <th scope="col" className="tutor-num">
            Conectados
          </th>
          <th scope="col">Solicitudes</th>
          <th scope="col">
            <span className="sr-only">Abrir</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => {
          const stats = getClassGroupStats(group, onlineStudentIds);
          const pending = group.pendingRequests.length;
          const theme = getGroupTheme(group.id);
          const fill = group.capacity > 0 ? Math.min(group.memberCount / group.capacity, 1) : 0;

          return (
            <tr key={group.id}>
              <td className="!px-0 !pl-2">
                <span
                  aria-hidden
                  className="block h-[30px] w-[4px] rounded-full"
                  style={{ background: theme.color }}
                />
              </td>
              <td className="py-1.5">
                <span className="block font-display text-[15.5px] font-semibold leading-tight text-tutor-ink">
                  {group.name}
                </span>
                <span className="block text-[13px] text-tutor-ink-soft">{group.gradeLabel}</span>
              </td>
              <td>
                <span className="rounded-[6px] border border-tutor-rule-strong px-2 py-0.5 text-[13px] font-semibold tracking-[0.04em] text-tutor-ink">
                  {group.publicId}
                </span>
              </td>
              <td className="py-1.5">
                <span className="block whitespace-nowrap">
                  {stats.totalStudents} de {group.capacity}
                </span>
                <span
                  aria-hidden
                  className="mt-1 block h-[4px] w-[96px] overflow-hidden rounded-full bg-tutor-rule"
                >
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${fill * 100}%`, background: theme.color }}
                  />
                </span>
              </td>
              <td className="tutor-num">{stats.connectedNow}</td>
              <td>
                {pending > 0 ? (
                  <span className="tutor-badge tutor-badge-warn">{pending} en espera</span>
                ) : null}
              </td>
              <td className="tutor-num">
                <button
                  type="button"
                  onClick={() => onOpen(group.id)}
                  className="tutor-btn tutor-btn-secondary tutor-btn-sm"
                >
                  Abrir
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export const TeacherGroupsModule = ({ groups, teacherName }: TeacherGroupsModuleProps) => {
  const navigate = useNavigate();
  const { createGroup, error, onlineStudentIds } = useClassrooms();
  const [creating, setCreating] = useState(false);

  /* Lo de buscar, ordenar y filtrar es de esta visita; sólo la vista se recuerda. */
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<GroupSortKey>('name');
  const [onlyPending, setOnlyPending] = useState(false);
  const [storedView, setStoredView] = useTeacherGroupsView();
  const listFits = useMinWidth(LIST_MIN_WIDTH);

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

  /*
   * Con pocos salones la pantalla se queda como siempre, en tarjetas y sin
   * herramientas: buscar entre seis no ayuda. Con más, la lista es lo primero,
   * salvo que el tutor eligiera tarjetas o la pantalla no la quepa.
   */
  const manyGroups = groups.length > GROUP_SEARCH_THRESHOLD;
  const view = manyGroups && listFits ? (storedView ?? 'list') : 'cards';

  const visibleGroups = manyGroups
    ? sortGroups(
        searchGroups(groups, query).filter(
          (group) => !onlyPending || group.pendingRequests.length > 0
        ),
        sortKey,
        onlineStudentIds
      )
    : groups;

  const groupsWithRequests = groups.filter((group) => group.pendingRequests.length > 0);
  const showRequestsStrip = manyGroups && groupsWithRequests.length > 0;

  const clearFilters = () => {
    setQuery('');
    setOnlyPending(false);
  };

  const openGroup = (groupId: string) => navigate(`${ROUTES.TEACHER_GROUPS}/${groupId}`);

  const handleCreate = async (input: CreateGroupInput) => {
    const created = await createGroup(input);

    if (!created) {
      return;
    }

    setCreating(false);
    navigate(`${ROUTES.TEACHER_GROUPS}/${created.id}`);
  };

  return (
    <div className="px-6 py-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1160px]">
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

            {/* Con la franja a la vista, esto la repetiría. */}
            {totalPending > 0 && !showRequestsStrip ? (
              <span className="tutor-badge tutor-badge-warn">{totalPending} en espera</span>
            ) : null}
          </div>

          {/* Con muchos salones, a quién responder no puede depender de encontrarlo en la lista. */}
          {showRequestsStrip ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[12px] border border-tutor-warn/30 bg-tutor-warn-soft px-4 py-2.5">
              <span className="text-[13.5px] font-semibold text-tutor-warn">
                Solicitudes en espera
              </span>
              {groupsWithRequests.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => openGroup(group.id)}
                  className="tutor-focus inline-flex h-[28px] items-center gap-1.5 rounded-full border border-tutor-warn/30 bg-tutor-surface px-2.5 text-[13.5px] font-semibold text-tutor-ink transition-colors hover:border-tutor-warn"
                >
                  <span
                    aria-hidden
                    className="h-[8px] w-[8px] rounded-full"
                    style={{ background: getGroupTheme(group.id).color }}
                  />
                  {group.name}
                  <span className="text-tutor-warn">{group.pendingRequests.length}</span>
                </button>
              ))}
            </div>
          ) : null}

          {manyGroups ? (
            <div className="tutor-card mt-3 flex flex-wrap items-end gap-2.5 px-4 py-3">
              <label className="block w-full min-w-0 flex-1 sm:w-auto sm:min-w-[200px]">
                <span className="mb-1.5 block text-[13.5px] font-medium text-tutor-ink-soft">
                  Buscar
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Filtrar salones"
                  placeholder="Nombre o ID del salón"
                  className="tutor-field"
                />
              </label>

              {/* El mínimo del selector compartido no cabe junto a la barra lateral a 375. */}
              <div className="w-full min-w-0 sm:w-auto [&>label]:min-w-0 sm:[&>label]:min-w-[140px]">
                <FilterSelect
                  label="Ordenar"
                  value={sortKey}
                  onChange={(value) => setSortKey(value as GroupSortKey)}
                  options={SORT_OPTIONS}
                  variant="tutor"
                />
              </div>

              {totalPending > 0 ? (
                <button
                  type="button"
                  onClick={() => setOnlyPending((current) => !current)}
                  aria-pressed={onlyPending}
                  className={`tutor-btn w-full sm:w-auto ${
                    onlyPending
                      ? 'border-tutor-accent bg-tutor-accent-soft text-tutor-accent'
                      : 'tutor-btn-secondary'
                  }`}
                >
                  Con solicitudes
                </button>
              ) : null}

              {listFits ? (
                <div role="group" aria-label="Vista" className="tutor-seg ml-auto">
                  <button
                    type="button"
                    onClick={() => setStoredView('list')}
                    aria-pressed={view === 'list'}
                  >
                    Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoredView('cards')}
                    aria-pressed={view === 'cards'}
                  >
                    Tarjetas
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {groups.length === 0 ? (
            <p className="tutor-card mt-4 px-5 py-10 text-center text-tutor-ink-soft">
              Todavía no administras ningún salón. Crea el primero con el botón de arriba.
            </p>
          ) : visibleGroups.length === 0 ? (
            <div className="tutor-card mt-3 px-5 py-8 text-center">
              <p className="text-tutor-ink-soft">Ningún salón coincide</p>
              <button
                type="button"
                onClick={clearFilters}
                className="tutor-btn tutor-btn-secondary tutor-btn-sm mt-3"
              >
                Quitar filtros
              </button>
            </div>
          ) : view === 'list' ? (
            <GroupsTable
              groups={visibleGroups}
              onlineStudentIds={onlineStudentIds}
              onOpen={openGroup}
            />
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {visibleGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onlineStudentIds={onlineStudentIds}
                  onOpen={() => openGroup(group.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
