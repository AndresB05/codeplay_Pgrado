import { useAuth } from '../../../hooks/useAuth';
import { useMissionAssignments } from '../../../hooks/useMissionAssignments';
import { useWorldLocks } from '../../../hooks/useWorldLocks';
import { missionWorldOrder } from '../student/worldLock';
import { formatDueDate } from '../../../lib/missionDue';
import type { Mission } from '../../../types/classroom.types';
import { TargetIcon } from '../teacher/TeacherIcons';
import { TILT_ON_HOVER, pickTilt } from './pickTilt';
import classroomStamp from '../../../assets/brand/settings-stamp-classroom.webp';

const MissionCard = ({
  mission,
  isCompleted,
  dueDate,
  lockedBy,
}: {
  mission: Mission;
  isCompleted: boolean;
  /** Último día para cumplirla; `null` es sin límite. */
  dueDate: string | null;
  /** El mundo que hay que superar antes, si la misión pide uno que sigue cerrado. */
  lockedBy: string | null;
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
        {lockedBy === null
          ? 'Se cumple jugando los niveles. ¡Sigue explorando!'
          : `Primero supera ${lockedBy} para poder cumplirla.`}
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
export const AssignedMissionsPanel = ({
  hideCompleted = false,
  onMap = false,
}: {
  hideCompleted?: boolean;
  /** Sobre el mapa del salón: la cabecera va en tinta, como el resto de esa pantalla. */
  onMap?: boolean;
}) => {
  const { user } = useAuth();
  const { catalog, assignments, completions, loading, error } = useMissionAssignments();
  const { blockerOf, worlds } = useWorldLocks(user?.id ?? null);

  /*
   * La misión de un mundo lleva su ORDEN en la clave; el candado es de cada
   * niño, así que el tutor la asigna igual y aquí se le dice qué falta.
   */
  const lockedBy = (missionKey: string): string | null => {
    const order = missionWorldOrder(missionKey);
    const target = order === null ? undefined : worlds.find((world) => world.orderIndex === order);

    return target === undefined ? null : (blockerOf(target.id)?.name ?? null);
  };

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
      {onMap ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-[50px] w-[50px] -rotate-[4deg] items-center justify-center rounded-full border-[3px] border-dashed border-grape-dark bg-wood-bare/70">
              <TargetIcon />
            </span>
            <h2 className="map-title font-display text-[30px] text-sepia">Misiones de tu salón</h2>
            <span className="ml-auto rotate-[3deg] rounded-md border-[3px] border-double border-jungle-dark bg-wood-bare/70 px-3 py-0.5 font-map text-[19px] font-normal text-jungle-dark">
              {completedCount} de {missions.length} cumplidas
            </span>
          </div>

          <p className="mt-1 font-map text-[19px] font-normal text-sepia">
            Tu tutor las eligió para ti. Dan más experiencia que un nivel normal.
          </p>
        </>
      ) : (
        /*
         * En «Mundos», una tira del pasaporte del saludo: el sello del salón y
         * una casilla por misión, que se sella al cumplirla. Va metida hasta la
         * línea oscura del saludo, un poco menor, porque pesa menos que él.
         */
        <div className="passport-page mx-6 flex flex-wrap items-center gap-5 [border-width:29px]">
          <img src={classroomStamp} alt="" className="h-[67px] w-[67px] -rotate-[8deg]" />
          <div className="min-w-0 flex-1">
            <h2 className="title-lg text-[23px]">Misiones de tu salón</h2>
            <p className="subtitle text-[15px]">
              Tu tutor las eligió para ti. Dan más experiencia que un nivel normal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {missions.map((mission) =>
              myCompletions.has(mission.key) ? (
                <img
                  key={mission.key}
                  src={classroomStamp}
                  alt=""
                  className="h-9 w-9 -rotate-[10deg]"
                />
              ) : (
                <span
                  key={mission.key}
                  aria-hidden
                  className="h-9 w-9 rounded-full border-[3px] border-dashed border-sepia-soft"
                />
              )
            )}
            <span className="ml-1.5 font-display text-[15px] text-sepia">
              {completedCount} de {missions.length} cumplidas
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {visibleMissions.map((mission) => (
          <MissionCard
            key={mission.key}
            mission={mission}
            isCompleted={myCompletions.has(mission.key)}
            dueDate={dueByMission.get(mission.key) ?? null}
            lockedBy={lockedBy(mission.key)}
          />
        ))}
      </div>
    </section>
  );
};
