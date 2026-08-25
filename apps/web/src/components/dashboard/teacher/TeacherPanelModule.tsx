import { useMemo, useState } from 'react';
import type { ClassGroup, Mission } from '../../../types/classroom.types';
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
  assigned,
  onToggle,
}: {
  mission: Mission;
  assigned: boolean;
  onToggle: () => void;
}) => {
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
        <span className="chip chip-sky">{mission.estimatedMinutes} min</span>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={assigned}
        className={`btn mt-4 w-full ${assigned ? 'btn-mint' : 'btn-grape'}`}
      >
        {assigned ? (
          <>
            <CheckIcon />
            Asignada
          </>
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
  const [assignedMissionIds, setAssignedMissionIds] = useState<string[]>([]);

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

  const toggleMission = (missionId: string) => {
    setAssignedMissionIds((current) =>
      current.includes(missionId)
        ? current.filter((id) => id !== missionId)
        : [...current, missionId]
    );
  };

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
          Retos personalizados para {scopeLabel}.{' '}
          {assignedMissionIds.length > 0
            ? `${assignedMissionIds.length} asignada${assignedMissionIds.length === 1 ? '' : 's'}.`
            : 'Todavía no has asignado ninguna.'}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {missionCatalog.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              assigned={assignedMissionIds.includes(mission.id)}
              onToggle={() => toggleMission(mission.id)}
            />
          ))}
        </div>
      </section>

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
