import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useFreshClassrooms } from '../../../hooks/useFreshClassrooms';
import { useMissionAssignments } from '../../../hooks/useMissionAssignments';
import { useStudentProgress } from '../../../hooks/useStudentProgress';
import { formatDueDate } from '../../../lib/missionDue';
import { bogotaDay } from '../../../lib/streak';
import {
  studentProgressService,
  type CatalogWorld,
} from '../../../services/studentProgress.service';
import type {
  ClassGroup,
  ClassroomStudent,
  LevelAttempt,
  Mission,
  StudentProgressDetail,
} from '../../../types/classroom.types';
import type { AppError } from '../../../errors/AppError';
import { StoreErrorNotice } from '../shared/StoreErrorNotice';
import { StatCard } from '../shared/StatCard';
import {
  buildWorldProgress,
  formatLastActivity,
  getClassroomProgressSummary,
  isWorldFinished,
  teacherResources,
  type StudentLevelProgress,
  type StudentWorldProgress,
} from './classroomsData';
import {
  BookIcon,
  CheckIcon,
  ChartIcon,
  MedalIcon,
  ProgressIcon,
  PulseIcon,
  StudentsIcon,
  TargetIcon,
} from './TeacherIcons';

interface TeacherPanelModuleProps {
  groups: ClassGroup[];
  /** Alcance elegido, leído de la dirección. `null` es «Todos». */
  groupId: string | null;
  /** Explorador elegido, leído de la dirección. */
  studentId: string | null;
}

const ALL_GROUPS = 'all';

/* Hasta que el catálogo llegue no hay denominador, y sin él no se pinta ninguna fracción. */
const EMPTY_CATALOG: CatalogWorld[] = [];

/**
 * La dirección del panel para un alcance y, si lo hay, un explorador.
 *
 * `all` representa «Todos», que es el valor que el panel ya usaba por dentro
 * para eso; los identificadores de salón son UUID, así que ninguno puede
 * valer `all`. Sin explorador, «Todos» no necesita tramo: la dirección se
 * queda en `/teacher/panel` a secas, que es la que ya existía.
 */
const panelPath = (groupId: string, studentId?: string): string => {
  if (!studentId) {
    return groupId === ALL_GROUPS ? ROUTES.TEACHER_PANEL : `${ROUTES.TEACHER_PANEL}/${groupId}`;
  }

  return `${ROUTES.TEACHER_PANEL}/${groupId}/${studentId}`;
};

/*
 * Lo que la tarjeta dice de la fecha límite de lo ya asignado. Con «Todos» cada
 * salón puede tener la suya, y entonces no hay una sola que enseñar.
 */
const dueLabel = (dueDates: (string | null)[]): string | null => {
  const distinct = new Set(dueDates);

  if (distinct.size === 0) {
    return null;
  }

  if (distinct.size > 1) {
    return 'Con fechas límite distintas según el salón.';
  }

  const [only] = distinct;

  return only === null ? 'Sin fecha límite.' : `Vence el ${formatDueDate(only)}.`;
};

const MissionCard = ({
  mission,
  assignedCount,
  dueDates,
  scopeSize,
  busy,
  onUnassign,
  onAssign,
}: {
  mission: Mission;
  /** Salones del alcance que ya la tienen. */
  assignedCount: number;
  /** La fecha límite de cada salón del alcance que ya la tiene. */
  dueDates: (string | null)[];
  /** Salones del alcance. Cero significa que el tutor no tiene ninguno. */
  scopeSize: number;
  busy: boolean;
  onUnassign: () => void;
  onAssign: (dueDate: string | null) => void;
}) => {
  const assignedEverywhere = scopeSize > 0 && assignedCount === scopeSize;
  const assignedPartially = assignedCount > 0 && !assignedEverywhere;

  /*
   * Asignar ya no es un clic: primero se elige hasta cuándo. «Sin fecha límite»
   * sale marcado porque es lo que la misión hacía siempre, y elegir un día lo
   * desmarca. El calendario es el del navegador, que ya sabe impedir los días
   * pasados con `min`; el servidor los rechaza igualmente.
   */
  const [choosingDate, setChoosingDate] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const today = bogotaDay();
  const due = dueLabel(dueDates);

  const confirmAssign = () => {
    onAssign(dueDate === '' ? null : dueDate);
    setChoosingDate(false);
    setDueDate('');
  };

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
        <span className="chip chip-sun">+{mission.xpReward} XP</span>
      </div>

      {assignedPartially ? (
        <p className="mt-3 text-[14px] font-bold text-ink-faint">
          Asignada en {assignedCount} de {scopeSize} salones.
        </p>
      ) : null}

      {due ? <p className="mt-2 text-[14px] font-bold text-grape-dark">{due}</p> : null}

      {choosingDate ? (
        <div className="mt-4 rounded-[18px] border-2 border-line bg-cream p-4">
          <p className="font-display text-[15px] text-ink">¿Hasta cuándo?</p>

          <label className="mt-3 flex items-center gap-2 text-[15px] font-bold text-ink">
            <input
              type="radio"
              name={`due-${mission.key}`}
              checked={dueDate === ''}
              onChange={() => setDueDate('')}
              className="h-4 w-4 accent-grape"
            />
            Sin fecha límite
          </label>

          <label className="mt-2 flex flex-wrap items-center gap-2 text-[15px] font-bold text-ink">
            <input
              type="radio"
              name={`due-${mission.key}`}
              checked={dueDate !== ''}
              onChange={() => setDueDate(today)}
              className="h-4 w-4 accent-grape"
            />
            Hasta el
            <input
              type="date"
              min={today}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              aria-label="Último día para cumplirla"
              className="rounded-[12px] border-2 border-line bg-white px-2 py-1 font-semibold text-ink"
            />
          </label>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={confirmAssign}
              disabled={busy || (dueDate !== '' && dueDate < today)}
              className="btn btn-sm btn-grape flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Asignar
            </button>
            <button
              type="button"
              onClick={() => {
                setChoosingDate(false);
                setDueDate('');
              }}
              className="btn btn-sm btn-ghost"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={assignedEverywhere ? onUnassign : () => setChoosingDate(true)}
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
      )}
    </article>
  );
};

/**
 * La ficha de un explorador: el catálogo entero agrupado por mundo, y encima lo
 * que lleva jugado.
 *
 * Se recorre el CATÁLOGO y no el progreso, y ahí está el paso 31: un nivel que
 * el alumno nunca empezó no tiene fila en el servidor, así que enseñar sólo lo
 * jugado dejaba a quien llevaba dos niveles de nueve con el mismo aspecto que a
 * quien los tenía todos, y un mundo sin tocar no aparecía en ninguna parte.
 *
 * La tira de pasos va sin desplegable a propósito. Con tres niveles por mundo
 * cabe en la fila, y el dato que el tutor viene a ver —si resolvió a la primera
 * o llegó probando— se lee de un vistazo en vez de tras un clic.
 */
const StudentProgressCard = ({
  student,
  catalog,
  detail,
  loading,
  error,
}: {
  student: ClassroomStudent;
  catalog: CatalogWorld[];
  detail: StudentProgressDetail | null;
  loading: boolean;
  error: AppError | null;
}) => {
  const worlds = useMemo(
    () => (detail ? buildWorldProgress(catalog, detail) : []),
    [catalog, detail]
  );

  if (error) {
    return (
      <div className="mt-4">
        <StoreErrorNotice error={error} />
      </div>
    );
  }

  if (loading || !detail) {
    return (
      <p className="mt-4 rounded-[18px] border-2 border-line bg-cream px-5 py-4 text-[15px] font-bold text-ink-faint">
        Cargando el avance de {student.name}…
      </p>
    );
  }

  const totalLevels = worlds.reduce((total, world) => total + world.totalLevels, 0);
  const completedLevels = worlds.reduce((total, world) => total + world.completedLevels, 0);
  const finishedWorlds = worlds.filter(isWorldFinished).length;

  return (
    <section className="card mt-4 overflow-x-auto">
      <div className="border-b-[3px] border-ink bg-grape-soft px-5 py-4">
        <h3 className="font-display text-[19px] text-grape-dark">{student.name}</h3>
        {/*
         * La última actividad se calla cuando no la hay: «última actividad Sin
         * actividad» es lo que salía, y de quien no ha jugado ya lo dice el aviso
         * de debajo.
         */}
        <p className="text-[14px] font-semibold text-grape-dark">
          {completedLevels} de {totalLevels} niveles superados · {finishedWorlds} de {worlds.length}{' '}
          mundos terminados · {student.totalAttempts} partidas
          {student.hoursSinceLastActivity === null
            ? null
            : ` · última actividad ${formatLastActivity(student.hoursSinceLastActivity)}`}
        </p>
      </div>

      {/*
       * El aviso va ENCIMA del catálogo y no en su lugar: sin él, nueve filas sin
       * una sola marca se leen como un fallo de carga en vez de como el mapa que
       * al explorador le espera entero.
       */}
      {detail.levels.length === 0 ? (
        <p className="border-b-2 border-line bg-cream px-5 py-3 text-[15px] font-bold text-ink-faint">
          {student.name} todavía no ha jugado ningún nivel.
        </p>
      ) : null}

      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-line">
            <th className="px-5 py-3 font-display text-[14px] text-ink">Nivel</th>
            <th className="px-5 py-3 font-display text-[14px] text-ink">Marca</th>
            <th className="px-5 py-3 font-display text-[14px] text-ink">Intentos</th>
            <th className="px-5 py-3 font-display text-[14px] text-ink">Pasos de cada partida</th>
          </tr>
        </thead>

        {worlds.map((world) => (
          <WorldSection key={world.worldId} world={world} />
        ))}
      </table>
    </section>
  );
};

/**
 * Un mundo y sus niveles. La cabecera lleva el recuento para que el tutor sepa
 * por dónde va sin recorrer las filas, y es lo que hace visible un mundo
 * intacto: sale con su nombre y su cero en vez de no salir.
 */
const WorldSection = ({ world }: { world: StudentWorldProgress }) => (
  <tbody>
    <tr className="border-b-2 border-line bg-grape-soft">
      <th colSpan={4} scope="colgroup" className="px-5 py-2.5 text-left">
        <span className="font-display text-[16px] text-grape-dark">{world.title}</span>
        <span className={`chip ml-2 ${isWorldFinished(world) ? 'chip-mint' : 'chip-sky'}`}>
          {world.completedLevels} de {world.totalLevels}
        </span>
      </th>
    </tr>

    {world.levels.map((level, index) => (
      <LevelRow key={level.levelId} level={level} striped={index % 2 === 1} />
    ))}
  </tbody>
);

/**
 * Una fila de nivel.
 *
 * «Sin empezar» y «Sin superar» se distinguen por las palabras y no sólo por el
 * color, porque son dos cosas distintas y el tutor hace algo distinto con cada
 * una: no haber ido nunca, y haber ido y no haber podido.
 */
const LevelRow = ({ level, striped }: { level: StudentLevelProgress; striped: boolean }) => {
  const { progress } = level;

  return (
    <tr className={`border-b-2 border-line ${striped ? 'bg-cream' : 'bg-white'}`}>
      <td className="px-5 py-3">
        <span className={`font-bold ${progress ? 'text-ink' : 'text-ink-faint'}`}>
          {level.title}
        </span>
      </td>

      <td className="px-5 py-3">
        {!progress ? (
          <span className="inline-flex rounded-full border-2 border-line bg-white px-3 py-0.5 font-display text-[13px] text-ink-faint">
            Sin empezar
          </span>
        ) : progress.completed ? (
          <span className="chip chip-mint">{progress.bestScore}/100</span>
        ) : (
          <span className="chip chip-sun">Sin superar</span>
        )}
      </td>

      <td className="px-5 py-3">
        {progress ? (
          <AttemptCount
            attemptCount={progress.attemptCount}
            storedAttempts={level.attempts.length}
          />
        ) : (
          <span className="text-[15px] font-semibold text-ink-faint">—</span>
        )}
      </td>

      <td className="px-5 py-3">
        <AttemptSteps attempts={level.attempts} optimalSteps={progress?.optimalSteps ?? null} />
      </td>
    </tr>
  );
};

/**
 * Las partidas de un nivel. Son DOS números cuando no coinciden, y eso es a
 * propósito: `user_progress.attempt_count` cuenta las partidas que la base
 * registró, y `level_attempts` guarda las que dejaron programa. Pueden separarse
 * —`upsert_my_progress` sigue siendo llamable sin intento, y así quedó alguna de
 * las pruebas viejas—, y entonces la tira de al lado enseña menos números que
 * este contador. Decirlo cuesta seis palabras; que el tutor cuente los chips y
 * no le cuadren, cuesta su confianza en la pantalla.
 */
const AttemptCount = ({
  attemptCount,
  storedAttempts,
}: {
  attemptCount: number;
  storedAttempts: number;
}) => (
  <>
    <span className="font-display text-[16px] text-ink">{attemptCount}</span>
    {storedAttempts < attemptCount ? (
      <span className="block text-[12px] font-semibold text-ink-faint">
        {storedAttempts} con programa guardado
      </span>
    ) : null}
  </>
);

/**
 * Los pasos de cada partida, en orden. Una partida cuyo programa el servidor no
 * supo leer sale como «?» y no como cero: un cero diría que se resolvió sin
 * hacer nada.
 */
const AttemptSteps = ({
  attempts,
  optimalSteps,
}: {
  attempts: LevelAttempt[];
  optimalSteps: number | null;
}) => {
  if (attempts.length === 0) {
    return <span className="text-[15px] font-semibold text-ink-faint">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {attempts.map((attempt) => (
        <span
          key={attempt.attemptId}
          aria-label={`${attempt.steps ?? 'pasos sin contar'}, ${
            attempt.isSuccess ? 'llegó a la meta' : 'no llegó a la meta'
          }`}
          className={`rounded-full border-2 px-2.5 py-0.5 font-display text-[14px] ${
            attempt.isSuccess
              ? 'border-mint-dark bg-mint-soft text-mint-dark'
              : 'border-line bg-white text-ink-faint'
          }`}
        >
          {/*
           * La cruz no es decoración: una partida que no llega a la meta puede
           * tener MENOS pasos que el óptimo —quedarse corto es la forma normal
           * de fallar—, así que sin ella la tira se lee como si el explorador
           * hubiera batido el récord una y otra vez. Y va además del color,
           * porque el color solo no lo dice para quien no lo distingue.
           */}
          {attempt.isSuccess ? '' : '×'}
          {attempt.steps ?? '?'}
        </span>
      ))}

      {optimalSteps === null ? null : (
        <span className="text-[13px] font-bold text-ink-faint">óptimo {optimalSteps}</span>
      )}
    </div>
  );
};

/**
 * Panel de Información del tutor: progreso real del salón, asignación de
 * misiones y recursos educativos.
 */
export const TeacherPanelModule = ({ groups, groupId, studentId }: TeacherPanelModuleProps) => {
  useFreshClassrooms();

  const navigate = useNavigate();

  /*
   * El alcance y el explorador elegidos viven en la DIRECCIÓN, no en estado: así
   * recargar no pierde la ficha que el tutor estaba mirando y el enlace se puede
   * pasar a quien ya podía verla. Quien la escribe es este panel; quien la lee,
   * `TeacherDashboard`.
   */
  const selectedGroupId = groupId ?? ALL_GROUPS;

  const [busyMissionId, setBusyMissionId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogWorld[]>(EMPTY_CATALOG);

  /*
   * El catálogo se lee una vez y no se refresca: es el denominador del panel y
   * el esqueleto de la ficha, y sólo cambia cuando entra contenido nuevo, que
   * hoy pasa por una migración.
   */
  useEffect(() => {
    void studentProgressService.getCatalog().then((result) => {
      if (result.data) {
        setCatalog(result.data);
      }
    });
  }, []);

  const {
    catalog: missionCatalog,
    assignments,
    completions,
    error: missionsError,
    assign,
    unassign,
  } = useMissionAssignments();

  const scopedGroups = useMemo(
    () =>
      selectedGroupId === ALL_GROUPS
        ? groups
        : groups.filter((group) => group.id === selectedGroupId),
    [groups, selectedGroupId]
  );

  const scopedStudents = useMemo(
    () => scopedGroups.flatMap((group) => group.students),
    [scopedGroups]
  );

  const summary = useMemo(
    () => getClassroomProgressSummary(scopedGroups, catalog),
    [scopedGroups, catalog]
  );

  /*
   * Un explorador que no esté en el alcance —una dirección vieja, o la de un
   * salón ajeno— simplemente no abre ficha. El filtro de verdad no está aquí
   * sino dentro de las vistas de la 0034, que a un identificador ajeno
   * responden vacío.
   */
  const selectedStudent = scopedStudents.find((student) => student.id === studentId) ?? null;

  const {
    detail,
    loading: detailLoading,
    error: detailError,
  } = useStudentProgress(selectedStudent?.id ?? null);

  /*
   * El destino de la escritura es el alcance elegido, no el panel entero: con un
   * salón elegido son sus ids, y con «Todos» los de todos los salones del tutor.
   */
  const scopedGroupIds = useMemo(() => scopedGroups.map((group) => group.id), [scopedGroups]);

  /* La fecha límite de cada salón que tiene la misión, por misión. */
  const dueByMission = useMemo(() => {
    const byMission = new Map<string, Map<string, string | null>>();

    assignments.forEach((assignment) => {
      const dueByGroup = byMission.get(assignment.missionKey) ?? new Map<string, string | null>();
      dueByGroup.set(assignment.groupId, assignment.dueDate);
      byMission.set(assignment.missionKey, dueByGroup);
    });

    return byMission;
  }, [assignments]);

  const dueDatesInScope = (missionId: string): (string | null)[] => {
    const dueByGroup = dueByMission.get(missionId);

    return dueByGroup
      ? scopedGroupIds
          .filter((groupId) => dueByGroup.has(groupId))
          .map((groupId) => dueByGroup.get(groupId) ?? null)
      : [];
  };

  /*
   * Al asignar se mandan todos los salones del alcance, incluidos los que ya
   * la tienen: la escritura les pone a todos la fecha elegida, así que no hace
   * falta calcular aquí el subconjunto y arriesgarse a hacerlo con estado viejo.
   */
  const assignMission = async (missionId: string, dueDate: string | null): Promise<void> => {
    if (scopedGroupIds.length === 0) {
      return;
    }

    setBusyMissionId(missionId);
    await assign(missionId, scopedGroupIds, dueDate);
    setBusyMissionId(null);
  };

  const unassignMission = async (missionId: string): Promise<void> => {
    setBusyMissionId(missionId);
    await unassign(missionId, scopedGroupIds);
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
     * Se recorre el catálogo y no las filas, para que el orden de las columnas
     * sea el mismo en el que el tutor las asignó desde la lista de arriba.
     */
    return missionCatalog.filter((mission) => assignedKeys.has(mission.key));
  }, [assignments, missionCatalog, selectedGroup]);

  /*
   * Quién ha cumplido qué, en un solo conjunto de claves «alumno + misión». Es
   * una tabla de alumnos por misiones y mirarla fila a fila con `find` la
   * convertiría en un recorrido cuadrático sobre los cumplimientos.
   */
  const completedPairs = useMemo(
    () => new Set(completions.map((completion) => `${completion.userId}:${completion.missionKey}`)),
    [completions]
  );

  const scopeLabel =
    selectedGroupId === ALL_GROUPS
      ? 'todos tus salones'
      : (groups.find((group) => group.id === selectedGroupId)?.name ?? 'este salón');

  /* El rótulo de alcance cabe en «para X», pero no detrás de «Cómo va». */
  const progressTitle =
    selectedGroupId === ALL_GROUPS
      ? 'Cómo van tus salones'
      : `Cómo va ${groups.find((group) => group.id === selectedGroupId)?.name ?? 'este salón'}`;

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
          Cuánto llevan jugado tus exploradores y qué puedes hacer al respecto.
        </p>
      </section>

      <section className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-faint">
          Salón
        </span>

        {/*
         * Cambiar de alcance SUELTA al explorador: un alumno pertenece a un
         * solo salón, así que mantenerlo elegido dejaría abierta la ficha de
         * alguien que ya no está en la lista de chips de debajo.
         */}
        <button
          type="button"
          onClick={() => navigate(panelPath(ALL_GROUPS))}
          className={chipClass(selectedGroupId === ALL_GROUPS)}
        >
          Todos
        </button>

        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => navigate(panelPath(group.id))}
            className={chipClass(selectedGroupId === group.id)}
          >
            {group.name}
          </button>
        ))}
      </section>

      <section className="mt-6">
        <div className="flex items-center gap-3">
          <ChartIcon />
          <h2 className="title-lg">{progressTitle}</h2>
        </div>

        <p className="subtitle mt-2">
          Lo que los exploradores llevan jugado. Los que todavía no han entrado cuentan en el total,
          pero no en el promedio de eficiencia.
        </p>

        {summary.totalStudents === 0 ? (
          <p className="mt-4 rounded-[18px] border-2 border-line bg-cream px-5 py-4 text-[15px] font-bold text-ink-faint">
            Todavía no hay exploradores inscritos, así que no hay avance que contar.
          </p>
        ) : summary.activeStudents === 0 ? (
          <p className="mt-4 rounded-[18px] border-2 border-sun-dark bg-sun-soft px-5 py-4 text-[15px] font-bold text-sun-dark">
            Ninguno de tus exploradores ha jugado todavía. En cuanto alguno empiece, aquí verás
            cuánto lleva y cuánto le costó.
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<StudentsIcon />}
                title="Han jugado"
                value={`${summary.activeStudents} de ${summary.totalStudents}`}
                tone="grape"
              />
              <StatCard
                icon={<ProgressIcon />}
                title="Niveles superados"
                value={`${summary.completedLevels} de ${summary.reachableLevels}`}
                tone="mint"
              />
              <StatCard
                icon={<MedalIcon />}
                title="Mundos terminados"
                value={`${summary.completedWorlds} de ${summary.reachableWorlds}`}
                tone="sky"
              />
              <StatCard
                icon={<PulseIcon />}
                title="Eficiencia media"
                value={summary.averageBestScore === null ? '—' : `${summary.averageBestScore}/100`}
                tone="sun"
              />
            </div>

            <p className="subtitle mt-6">
              Elige un explorador para ver cuánto le costó cada nivel.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {scopedStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      panelPath(selectedGroupId, student.id === studentId ? undefined : student.id)
                    )
                  }
                  aria-pressed={student.id === studentId}
                  className={chipClass(student.id === studentId)}
                >
                  {student.name}
                </button>
              ))}
            </div>

            {selectedStudent ? (
              <StudentProgressCard
                student={selectedStudent}
                catalog={catalog}
                detail={detail}
                loading={detailLoading}
                error={detailError}
              />
            ) : null}
          </>
        )}
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
              key={mission.key}
              mission={mission}
              assignedCount={dueDatesInScope(mission.key).length}
              dueDates={dueDatesInScope(mission.key)}
              scopeSize={scopedGroupIds.length}
              busy={busyMissionId === mission.key}
              onUnassign={() => {
                void unassignMission(mission.key);
              }}
              onAssign={(dueDate) => {
                void assignMission(mission.key, dueDate);
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
                      <th key={mission.key} className="px-5 py-4 font-display text-[15px] text-ink">
                        {mission.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup.students.map((student) => (
                    <tr key={student.id} className="border-b-2 border-line last:border-b-0">
                      <td className="px-5 py-4 text-[15px] font-bold text-ink">{student.name}</td>
                      {assignedMissions.map((mission) => {
                        const isCompleted = completedPairs.has(`${student.id}:${mission.key}`);

                        return (
                          <td key={mission.key} className="px-5 py-4">
                            <span className={isCompleted ? 'chip chip-mint' : 'chip chip-sun'}>
                              {isCompleted ? 'Cumplida' : 'Pendiente'}
                            </span>
                          </td>
                        );
                      })}
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
