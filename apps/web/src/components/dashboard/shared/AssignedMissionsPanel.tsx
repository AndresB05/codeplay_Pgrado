import { useAuth } from '../../../hooks/useAuth';
import { useMissionAssignments } from '../../../hooks/useMissionAssignments';
import { formatDueDate } from '../../../lib/missionDue';
import type { Mission } from '../../../types/classroom.types';
import { TargetIcon } from '../teacher/TeacherIcons';
import { TropicalFlower } from '../../decor/JungleDecor';
import { TILT_ON_HOVER, pickTilt } from './pickTilt';

const MissionCard = ({
  mission,
  isCompleted,
  dueDate,
}: {
  mission: Mission;
  isCompleted: boolean;
  /** Último día para cumplirla; `null` es sin límite. */
  dueDate: string | null;
}) => (
  <article
    onMouseEnter={pickTilt}
    className={`relative isolate flex flex-col px-14 pb-11 pt-10 ${TILT_ON_HOVER}`}
  >
    <div aria-hidden className="map-sheet pointer-events-none absolute inset-0 -z-10" />

    {/*
     * Escrita como sobre el mapa: letra de mano en tinta café, y las etiquetas
     * como sellos de tinta en vez de pastillas de color.
     */}
    <div className="flex items-start justify-between gap-3">
      <h3 className="font-map text-[20px] font-normal leading-tight text-sepia">{mission.title}</h3>
      <span className="shrink-0 rotate-[4deg] rounded-md border-2 border-dashed border-grape-dark px-1.5 font-map text-[14px] text-grape-dark">
        {mission.difficultyLabel}
      </span>
    </div>

    <p className="mt-1 flex-1 font-map text-[15px] font-normal leading-[1.3] text-sepia-soft">
      {mission.description}
    </p>

    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="-rotate-[3deg] rounded-full border-2 border-ink px-2 font-map text-[14px] text-sepia">
        +{mission.xpReward} XP
      </span>
      {/* Cumplida, la fecha ya no le dice nada: lo ganado no caduca. */}
      {dueDate !== null && !isCompleted ? (
        <span className="rotate-[2deg] rounded-md border-2 border-dashed border-coral-dark px-1.5 font-map text-[14px] text-coral-dark">
          Hasta el {formatDueDate(dueDate)}
        </span>
      ) : null}
    </div>

    {/*
     * Sigue sin haber botón, y ahora por otro motivo: una misión no se empieza,
     * se cumple jugando los niveles que ya existen. Un botón prometería una
     * pantalla propia que no tiene.
     */}
    {isCompleted ? (
      <p className="mt-2.5 self-start -rotate-[2deg] rounded-md border-[3px] border-double border-jungle-dark px-2.5 font-map text-[15px] text-jungle-dark">
        ¡Cumplida! Ganaste {mission.xpReward} XP.
      </p>
    ) : (
      <p className="mt-2.5 border-t-2 border-dashed border-ink pt-1.5 font-map text-[14px] text-sepia-soft">
        Se cumple jugando los niveles. ¡Sigue explorando!
      </p>
    )}
  </article>
);

/**
 * Las misiones que el tutor asignó al salón del niño, con lo que él lleva
 * cumplido.
 *
 * Vive en `shared/` por lo mismo que `StudentRosterTable`: lo montan dos
 * pantallas del niño —«Mundos» y «Mi salón»— con marcos distintos.
 *
 * **No se pinta si no hay nada que enseñar.** Un niño sin salón no tiene tutor
 * que le asigne nada, y uno con salón puede no tener ninguna misión todavía: en
 * los dos casos una tarjeta vacía sería ruido. Un fallo de lectura sí se dice,
 * porque callarlo afirmaría que no hay misiones.
 *
 * **En «Mi salón» una misión cumplida NO desaparece.** La asignación es del
 * salón y el cumplimiento es de cada alumno: la misión sigue ahí hasta que el
 * tutor la retire, y al que ya la cumplió le queda como lo que ganó. En «Mundos»
 * sí se va (`hideCompleted`): ahí el niño viene a jugar, y lo ya cumplido sólo
 * le estorba entre él y los mundos.
 */
export const AssignedMissionsPanel = ({ hideCompleted = false }: { hideCompleted?: boolean }) => {
  const { user } = useAuth();
  const { catalog, assignments, completions, loading, error } = useMissionAssignments();

  if (error) {
    return (
      <section className="mt-8 rounded-[20px] border-2 border-coral-dark bg-coral-soft px-5 py-4 text-[15px] font-bold text-coral-dark">
        {error.message}
      </section>
    );
  }

  if (loading || assignments.length === 0) {
    return null;
  }

  /*
   * Se recorre el catálogo y no las asignaciones para que el orden sea el suyo,
   * el mismo que ve el tutor al asignarlas. Desde que `mission_key` tiene clave
   * ajena, toda asignación apunta a una misión que existe.
   */
  const assignedKeys = new Set(assignments.map((assignment) => assignment.missionKey));
  /*
   * El niño está en un solo salón, así que cada misión le llega con una sola
   * fecha. Si algún día fueran varias, vale la más generosa: sin límite gana.
   */
  const dueByMission = new Map<string, string | null>();
  assignments.forEach((assignment) => {
    const current = dueByMission.get(assignment.missionKey);
    const later =
      current === null || assignment.dueDate === null
        ? null
        : current === undefined || assignment.dueDate > current
          ? assignment.dueDate
          : current;
    dueByMission.set(assignment.missionKey, later);
  });
  const missions = catalog.filter((mission) => assignedKeys.has(mission.key));

  if (missions.length === 0) {
    return null;
  }

  /*
   * La RLS ya sólo le devuelve al niño lo suyo, pero el filtro por `userId` se
   * escribe igual: este mismo hook lo usa el panel del tutor, donde `completions`
   * trae las de TODOS sus alumnos.
   */
  const myCompletions = new Set(
    completions
      .filter((completion) => completion.userId === user?.id)
      .map((completion) => completion.missionKey)
  );

  const completedCount = missions.filter((mission) => myCompletions.has(mission.key)).length;
  const visibleMissions = hideCompleted
    ? missions.filter((mission) => !myCompletions.has(mission.key))
    : missions;

  if (visibleMissions.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[16px] border-[3px] border-ink bg-sun-soft">
          <TargetIcon />
        </span>
        <h2 className="title-lg">Misiones de tu salón</h2>
        <span className="chip chip-leaf ml-auto">
          <TropicalFlower size={16} />
          {completedCount} de {missions.length} cumplidas
        </span>
      </div>

      <p className="subtitle mt-1">
        Tu tutor las eligió para ti. Dan más experiencia que un nivel normal.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {visibleMissions.map((mission) => (
          <MissionCard
            key={mission.key}
            mission={mission}
            isCompleted={myCompletions.has(mission.key)}
            dueDate={dueByMission.get(mission.key) ?? null}
          />
        ))}
      </div>
    </section>
  );
};
