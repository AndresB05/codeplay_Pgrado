import { useMemo, useState } from 'react';
import { useMissionAssignments } from '../../../hooks/useMissionAssignments';
import type { ClassGroup, Mission } from '../../../types/classroom.types';
import { StoreErrorNotice } from '../shared/StoreErrorNotice';
import { getSkillLabel, getSkillReports, missionCatalog, teacherResources } from './classroomsData';
import { BookIcon, CheckIcon, ChartIcon, TargetIcon } from './TeacherIcons';

interface TeacherPanelModuleProps {
  groups: ClassGroup[];
  /** Salón preseleccionado al llegar desde "Ver progreso detallado". */
  initialGroupId: string | null;
}

const ALL_GROUPS = 'all';

const getMasteryTone = (mastery: number): { bar: string; text: string } => {
  if (mastery >= 70) {
    return { bar: 'bg-lime', text: 'text-lime-dark' };
  }

  if (mastery >= 45) {
    return { bar: 'bg-sun', text: 'text-sun-dark' };
  }

  return { bar: 'bg-coral', text: 'text-coral-dark' };
};

const MissionCard = ({
  mission,
  assignedCount,
  scopeSize,
  busy,
  onToggle,
}: {
  mission: Mission;
  /** Salones del alcance que ya la tienen. */
  assignedCount: number;
  /** Salones del alcance. Cero significa que el tutor no tiene ninguno. */
  scopeSize: number;
  busy: boolean;
  onToggle: () => void;
}) => {
  const assignedEverywhere = scopeSize > 0 && assignedCount === scopeSize;
  const assignedPartially = assignedCount > 0 && !assignedEverywhere;

  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[19px] leading-tight text-ink">{mission.title}</h3>
        <span className="chip chip-grape shrink-0">{mission.difficultyLabel}</span>
      </div>

      <p className="mt-2 flex-1 text-[15px] font-semibold leading-[1.6] text-ink-soft">
        {mission.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="chip chip-mint">{getSkillLabel(mission.skill)}</span>
        <span className="chip chip-sun">+{mission.xpReward} XP</span>
        <span className="chip chip-sky">{mission.estimatedMinutes} min</span>
      </div>

      {assignedPartially ? (
        <p className="mt-3 text-[14px] font-bold text-ink-faint">
          Asignada en {assignedCount} de {scopeSize} salones.
        </p>
      ) : null}

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={assignedEverywhere}
        disabled={scopeSize === 0 || busy}
        title={scopeSize === 0 ? 'Primero crea un salón' : undefined}
        className={`btn mt-4 w-full ${assignedEverywhere ? 'btn-mint' : 'btn-grape'} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {assignedEverywhere ? (
          <>
            <CheckIcon />
            Asignada
          </>
        ) : assignedPartially ? (
          'Asignar en los demás'
        ) : (
          'Asignar misión'
        )}
      </button>
    </article>
  );
};

/**
 * Panel de Información del tutor: reportes de habilidades, asignación de
 * misiones y recursos educativos.
 */
export const TeacherPanelModule = ({ groups, initialGroupId }: TeacherPanelModuleProps) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId ?? ALL_GROUPS);
  const [busyMissionId, setBusyMissionId] = useState<string | null>(null);

  const { assignments, error: missionsError, assign, unassign } = useMissionAssignments();

  const scopedGroups = useMemo(
    () =>
      selectedGroupId === ALL_GROUPS
        ? groups
        : groups.filter((group) => group.id === selectedGroupId),
    [groups, selectedGroupId]
  );

  const skillReports = useMemo(() => getSkillReports(scopedGroups), [scopedGroups]);

  const weakestSkill = useMemo(
    () =>
      skillReports.reduce(
        (weakest, report) => (report.mastery < weakest.mastery ? report : weakest),
        skillReports[0]
      ),
    [skillReports]
  );

  /*
   * El destino de la escritura es el alcance elegido, no el panel entero: con un
   * salón elegido son sus ids, y con «Todos» los de todos los salones del tutor.
   */
  const scopedGroupIds = useMemo(() => scopedGroups.map((group) => group.id), [scopedGroups]);

  const groupIdsByMission = useMemo(() => {
    const byMission = new Map<string, Set<string>>();

    assignments.forEach((assignment) => {
      const groupIds = byMission.get(assignment.missionKey) ?? new Set<string>();
      groupIds.add(assignment.groupId);
      byMission.set(assignment.missionKey, groupIds);
    });

    return byMission;
  }, [assignments]);

  const countAssignedInScope = (missionId: string): number => {
    const groupIds = groupIdsByMission.get(missionId);

    return groupIds ? scopedGroupIds.filter((groupId) => groupIds.has(groupId)).length : 0;
  };

  const toggleMission = async (missionId: string): Promise<void> => {
    if (scopedGroupIds.length === 0) {
      return;
    }

    const assignedEverywhere = countAssignedInScope(missionId) === scopedGroupIds.length;

    setBusyMissionId(missionId);
    /*
     * Al asignar se mandan todos los salones del alcance, incluidos los que ya
     * la tienen: la escritura ignora los duplicados, así que no hace falta
     * calcular aquí el subconjunto y arriesgarse a hacerlo con estado viejo.
     */
    if (assignedEverywhere) {
      await unassign(missionId, scopedGroupIds);
    } else {
      await assign(missionId, scopedGroupIds);
    }
    setBusyMissionId(null);
  };

  /*
   * El apartado de cumplimiento sólo existe con un salón concreto elegido: con
   * «Todos» habría que mezclar en una misma tabla alumnos de salones distintos.
   */
  const selectedGroup =
    selectedGroupId === ALL_GROUPS
      ? null
      : (groups.find((group) => group.id === selectedGroupId) ?? null);

  const assignedMissions = useMemo(() => {
    if (!selectedGroup) {
      return [];
    }

    const assignedKeys = new Set(
      assignments
        .filter((assignment) => assignment.groupId === selectedGroup.id)
        .map((assignment) => assignment.missionKey)
    );

    /*
     * `missionKey` es texto sin clave ajena, así que se recorre el catálogo y no
     * las filas: una clave que ya no exista en el catálogo se queda fuera en vez
     * de pintar una columna sin título.
     */
    return missionCatalog.filter((mission) => assignedKeys.has(mission.id));
  }, [assignments, selectedGroup]);

  const scopeLabel =
    selectedGroupId === ALL_GROUPS
      ? 'todos tus salones'
      : (groups.find((group) => group.id === selectedGroupId)?.name ?? 'este salón');

  const chipClass = (active: boolean) =>
    `rounded-full border-[3px] px-5 py-2 font-display text-[15px] transition-colors ${
      active
        ? 'border-ink bg-grape text-white shadow-[0_4px_0_rgba(42,27,69,0.2)]'
        : 'border-line bg-white text-ink hover:bg-cream'
    }`;

  return (
    <div className="px-5 py-5">
      <section>
        <h1 className="title-xl">Panel de información</h1>
        <p className="subtitle mt-1">
          Cómo avanza el pensamiento computacional y qué puedes hacer al respecto.
        </p>
      </section>

      <section className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-faint">
          Salón
        </span>

        <button
          type="button"
          onClick={() => setSelectedGroupId(ALL_GROUPS)}
          className={chipClass(selectedGroupId === ALL_GROUPS)}
        >
          Todos
        </button>

        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setSelectedGroupId(group.id)}
            className={chipClass(selectedGroupId === group.id)}
          >
            {group.name}
          </button>
        ))}
      </section>

      <section className="card mt-6 p-6">
        <div className="flex items-center gap-3">
          <ChartIcon />
          <h2 className="title-lg">Reportes de habilidades</h2>
        </div>

        <p className="subtitle mt-2">
          Promedio de dominio en {scopeLabel}. Los niños que todavía no han entrado a la plataforma
          no entran en el promedio.
        </p>

        <div className="mt-6 space-y-5">
          {skillReports.map((report) => {
            const tone = getMasteryTone(report.mastery);

            return (
              <div key={report.key}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="font-display text-[18px] text-ink">{report.label}</h3>
                    <p className="text-[14px] font-semibold text-ink-faint">{report.description}</p>
                  </div>

                  <div className="text-right">
                    <span className={`font-display text-[22px] ${tone.text}`}>
                      {report.mastery}%
                    </span>
                    <p className="text-[13px] font-bold text-ink-faint">
                      {report.studentsMastered} de {report.studentsEvaluated} lo dominan
                    </p>
                  </div>
                </div>

                <div
                  className="mt-2 h-[20px] w-full overflow-hidden rounded-full border-[3px] border-ink bg-cream"
                  role="progressbar"
                  aria-valuenow={report.mastery}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Dominio de ${report.label}`}
                >
                  <div
                    className={`h-full rounded-full ${tone.bar}`}
                    style={{ width: `${report.mastery}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {weakestSkill ? (
          <p className="mt-6 rounded-[18px] border-2 border-sun-dark bg-sun-soft px-5 py-4 text-[15px] font-bold text-sun-dark">
            La habilidad más floja es {weakestSkill.label} ({weakestSkill.mastery}%). Abajo puedes
            asignar una misión que la trabaje.
          </p>
        ) : null}
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-3">
          <TargetIcon />
          <h2 className="title-lg">Asignación de misiones</h2>
        </div>

        <p className="subtitle mt-1">
          Retos personalizados para {scopeLabel}. Dan más experiencia que un nivel normal, y el niño
          sólo ve las que le asignas.
        </p>

        {groups.length === 0 ? (
          <p className="mt-4 rounded-[18px] border-2 border-sun-dark bg-sun-soft px-5 py-4 text-[15px] font-bold text-sun-dark">
            Todavía no tienes ningún salón, así que no hay a quién asignarle una misión. Crea uno y
            vuelve por aquí.
          </p>
        ) : null}

        <div className="mt-4">
          <StoreErrorNotice error={missionsError} />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {missionCatalog.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              assignedCount={countAssignedInScope(mission.id)}
              scopeSize={scopedGroupIds.length}
              busy={busyMissionId === mission.id}
              onToggle={() => {
                void toggleMission(mission.id);
              }}
            />
          ))}
        </div>
      </section>

      {selectedGroup && assignedMissions.length > 0 ? (
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <CheckIcon />
            <h2 className="title-lg">Quién ha cumplido</h2>
          </div>

          <p className="subtitle mt-1">
            Misiones asignadas a {selectedGroup.name} y cómo va cada explorador.
          </p>

          {/*
           * El motivo va antes que la tabla y sin desplegar nada: una lista
           * entera en «Pendiente» sin explicación se lee como un fallo de la
           * aplicación, y no lo es.
           */}
          <p className="mt-4 rounded-[18px] border-2 border-sun-dark bg-sun-soft px-5 py-4 text-[15px] font-bold text-sun-dark">
            Todos aparecen en «Pendiente» porque todavía no hay forma de cumplir una misión: nadie
            puede completarlas hasta que el juego reporte el progreso.
          </p>

          {selectedGroup.students.length === 0 ? (
            <p className="mt-4 rounded-[18px] border-2 border-line bg-cream px-5 py-4 text-[15px] font-bold text-ink-faint">
              Este salón todavía no tiene exploradores inscritos.
            </p>
          ) : (
            <div className="card mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b-[3px] border-line">
                    <th className="px-5 py-4 font-display text-[15px] text-ink">Explorador</th>
                    {assignedMissions.map((mission) => (
                      <th key={mission.id} className="px-5 py-4 font-display text-[15px] text-ink">
                        {mission.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup.students.map((student) => (
                    <tr key={student.id} className="border-b-2 border-line last:border-b-0">
                      <td className="px-5 py-4 text-[15px] font-bold text-ink">{student.name}</td>
                      {assignedMissions.map((mission) => (
                        <td key={mission.id} className="px-5 py-4">
                          <span className="chip chip-sun">Pendiente</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <section className="mt-8 pb-4">
        <div className="flex items-center gap-3">
          <BookIcon />
          <h2 className="title-lg">Recursos educativos</h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {teacherResources.map((resource) => (
            <article key={resource.id} className="card p-5">
              <span className="chip chip-mint">{resource.categoryLabel}</span>

              <h3 className="mt-3 font-display text-[19px] text-ink">{resource.title}</h3>

              <p className="mt-2 text-[15px] font-semibold leading-[1.6] text-ink-soft">
                {resource.description}
              </p>

              <p className="mt-3 text-[14px] font-bold text-ink-faint">
                {resource.readMinutes} min de lectura
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
