import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pickMascotAvatar } from '../../../constants/mascotAvatars';
import { ROUTES } from '../../../constants/routes';
import { useClassrooms } from '../../../hooks/useClassrooms';
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
import { ChevronIcon } from '../shared/RosterFilterBar';
import { MissionCompletionTable } from './MissionCompletionTable';
import { StatRing } from './StatRing';
import { StudentPicker } from './StudentPicker';
import { TeacherResourceDialog } from './TeacherResourceDialog';
import { resourceReadMinutes, teacherResources } from './teacherResources';
import {
  buildWorldProgress,
  formatLastActivity,
  getClassroomProgressSummary,
  isWorldFinished,
  sortGroups,
  type StudentLevelProgress,
  type StudentWorldProgress,
} from './classroomsData';
import { CheckIcon } from './TeacherIcons';

interface TeacherPanelModuleProps {
  groups: ClassGroup[];
  /** Alcance elegido, leído de la dirección. `null` es «Todos». */
  groupId: string | null;
  /** Explorador elegido, leído de la dirección. */
  studentId: string | null;
}

const ALL_GROUPS = 'all';

type PanelTab = 'progress' | 'missions' | 'resources';

const TABS: { key: PanelTab; label: string }[] = [
  { key: 'progress', label: 'Progreso' },
  { key: 'missions', label: 'Misiones' },
  { key: 'resources', label: 'Recursos' },
];

/* La pestaña que pide quien navega hasta aquí, como «Recursos» en la barra superior. */
const requestedTab = (state: unknown): PanelTab | null => {
  const tab = (state as { panelTab?: unknown } | null)?.panelTab;

  return TABS.some((item) => item.key === tab) ? (tab as PanelTab) : null;
};

/* Una proporción para el anillo; sin denominador no hay nada que dibujar. */
const ratioOf = (part: number, whole: number): number | null => (whole > 0 ? part / whole : null);

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
    <article className="tutor-card flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[17px] leading-tight text-tutor-ink">{mission.title}</h3>
        <span className="tutor-badge tutor-badge-mute tutor-badge-plain shrink-0">
          {mission.difficultyLabel}
        </span>
      </div>

      <p className="mt-1.5 flex-1 text-[14.5px] leading-[1.55] text-tutor-ink-soft">
        {mission.description}
      </p>

      <p className="mt-3 text-[14px] font-semibold text-tutor-ink">+{mission.xpReward} XP</p>

      {assignedPartially ? (
        <p className="mt-1 text-[14px] text-tutor-ink-soft">
          Asignada en {assignedCount} de {scopeSize} salones.
        </p>
      ) : null}

      {due ? <p className="mt-1 text-[14px] font-semibold text-tutor-accent">{due}</p> : null}

      {choosingDate ? (
        <div className="mt-3 rounded-[8px] border border-tutor-rule bg-tutor-sunken p-3">
          <p className="font-semibold text-tutor-ink">¿Hasta cuándo?</p>

          <label className="mt-2 flex items-center gap-2 text-[14.5px] text-tutor-ink">
            <input
              type="radio"
              name={`due-${mission.key}`}
              checked={dueDate === ''}
              onChange={() => setDueDate('')}
              className="h-4 w-4 accent-tutor-accent"
            />
            Sin fecha límite
          </label>

          <label className="mt-1.5 flex flex-wrap items-center gap-2 text-[14.5px] text-tutor-ink">
            <input
              type="radio"
              name={`due-${mission.key}`}
              checked={dueDate !== ''}
              onChange={() => setDueDate(today)}
              className="h-4 w-4 accent-tutor-accent"
            />
            Hasta el
            <input
              type="date"
              min={today}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              aria-label="Último día para cumplirla"
              className="tutor-field h-[32px] w-auto"
            />
          </label>

          <div className="mt-3 flex gap-1.5">
            <button
              type="button"
              onClick={confirmAssign}
              disabled={busy || (dueDate !== '' && dueDate < today)}
              className="tutor-btn tutor-btn-primary tutor-btn-sm flex-1"
            >
              Asignar
            </button>
            <button
              type="button"
              onClick={() => {
                setChoosingDate(false);
                setDueDate('');
              }}
              className="tutor-btn tutor-btn-secondary tutor-btn-sm"
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
          title={
            scopeSize === 0
              ? 'Primero crea un salón'
              : assignedEverywhere
                ? 'Pulsa para quitarla de los salones'
                : undefined
          }
          className={`tutor-btn mt-3 w-full ${
            assignedEverywhere ? 'tutor-btn-secondary text-tutor-ok' : 'tutor-btn-primary'
          }`}
        >
          {assignedEverywhere ? (
            <>
              <CheckIcon variant="tutor" />
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
      <div>
        <StoreErrorNotice error={error} variant="tutor" />
      </div>
    );
  }

  if (loading || !detail) {
    return (
      <p className="tutor-card px-4 py-3 text-tutor-ink-soft">
        Cargando el avance de {student.name}…
      </p>
    );
  }

  const totalLevels = worlds.reduce((total, world) => total + world.totalLevels, 0);
  const completedLevels = worlds.reduce((total, world) => total + world.completedLevels, 0);
  const finishedWorlds = worlds.filter(isWorldFinished).length;

  return (
    <section className="tutor-card overflow-x-auto">
      <div className="flex items-center gap-3 border-b border-tutor-rule px-4 py-3">
        <img
          src={pickMascotAvatar(student.id, student.name)}
          alt=""
          className="h-[36px] w-[36px] shrink-0 rounded-full border border-tutor-rule object-cover"
        />
        <div className="min-w-0">
          <h3 className="text-[19px] leading-tight text-tutor-ink">{student.name}</h3>
          {/*
           * La última actividad se calla cuando no la hay: «última actividad Sin
           * actividad» es lo que salía, y de quien no ha jugado ya lo dice el aviso
           * de debajo.
           */}
          <p className="text-[14px] text-tutor-ink-soft">
            {completedLevels} de {totalLevels} niveles superados · {finishedWorlds} de{' '}
            {worlds.length} mundos terminados · {student.totalAttempts} partidas
            {student.hoursSinceLastActivity === null
              ? null
              : ` · última actividad ${formatLastActivity(student.hoursSinceLastActivity)}`}
          </p>
        </div>
      </div>

      {/*
       * El aviso va ENCIMA del catálogo y no en su lugar: sin él, nueve filas sin
       * una sola marca se leen como un fallo de carga en vez de como el mapa que
       * al explorador le espera entero.
       */}
      {detail.levels.length === 0 ? (
        <p className="border-b border-tutor-rule bg-tutor-sunken px-4 py-2.5 text-tutor-ink-soft">
          {student.name} todavía no ha jugado ningún nivel.
        </p>
      ) : null}

      <table className="tutor-table min-w-[640px]">
        <thead>
          <tr>
            {/* Junto a la lista de exploradores la ficha es más estrecha: el nombre no se parte en tres. */}
            <th scope="col" className="min-w-[200px]">
              Nivel
            </th>
            <th scope="col">Marca</th>
            <th scope="col" className="tutor-num">
              Intentos
            </th>
            <th scope="col">
              Pasos de cada partida{' '}
              <span className="ml-1 font-medium text-tutor-ink-faint">× no llegó a la meta</span>
            </th>
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
    <tr>
      <th
        colSpan={4}
        scope="colgroup"
        className="!bg-tutor-surface !pt-4 text-left !text-[15.5px] !text-tutor-ink"
      >
        <span className="font-bold">{world.title}</span>
        <span
          className={`tutor-badge tutor-badge-plain ml-2 ${
            isWorldFinished(world) ? 'tutor-badge-ok' : 'tutor-badge-info'
          }`}
        >
          {world.completedLevels} de {world.totalLevels}
        </span>
      </th>
    </tr>

    {world.levels.map((level) => (
      <LevelRow key={level.levelId} level={level} />
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
const LevelRow = ({ level }: { level: StudentLevelProgress }) => {
  const { progress } = level;

  return (
    <tr>
      <td className={progress ? 'text-tutor-ink' : 'text-tutor-ink-faint'}>{level.title}</td>

      <td>
        {!progress ? (
          <span className="tutor-badge tutor-badge-mute">Sin empezar</span>
        ) : progress.completed ? (
          <span className="tutor-badge tutor-badge-ok">{progress.bestScore}/100</span>
        ) : (
          <span className="tutor-badge tutor-badge-warn">Sin superar</span>
        )}
      </td>

      <td className="tutor-num py-1.5">
        {progress ? (
          <AttemptCount
            attemptCount={progress.attemptCount}
            storedAttempts={level.attempts.length}
          />
        ) : (
          <span className="text-tutor-ink-faint">—</span>
        )}
      </td>

      <td className="py-1.5">
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
    <span className="block font-semibold text-tutor-ink">{attemptCount}</span>
    {storedAttempts < attemptCount ? (
      <span className="block whitespace-nowrap text-[12px] text-tutor-ink-faint">
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
    return <span className="text-tutor-ink-faint">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {attempts.map((attempt) => {
        /* «×4» se lee como «cuatro veces»: la frase entera va al pasar el ratón y al lector de pantalla. */
        const label = `${attempt.isSuccess ? 'Superada' : 'No superada'} · ${
          attempt.steps === null ? 'pasos sin contar' : `${attempt.steps} pasos`
        }`;

        return (
          <span
            key={attempt.attemptId}
            title={label}
            aria-label={label}
            className={`min-w-[28px] rounded-[6px] border px-1.5 text-center text-[13px] font-semibold ${
              attempt.isSuccess
                ? 'border-transparent bg-tutor-ok-soft text-tutor-ok'
                : 'border-tutor-rule-strong text-tutor-ink-soft'
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
        );
      })}

      {optimalSteps === null ? null : (
        <span className="ml-1 text-[13px] text-tutor-ink-faint">óptimo {optimalSteps}</span>
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
  const { onlineStudentIds } = useClassrooms();

  const navigate = useNavigate();

  /*
   * El alcance y el explorador elegidos viven en la DIRECCIÓN, no en estado: así
   * recargar no pierde la ficha que el tutor estaba mirando y el enlace se puede
   * pasar a quien ya podía verla. Quien la escribe es este panel; quien la lee,
   * `TeacherDashboard`.
   */
  const selectedGroupId = groupId ?? ALL_GROUPS;
  const location = useLocation();
  const [tab, setTab] = useState<PanelTab>(() => requestedTab(location.state) ?? 'progress');

  /* Con el panel ya abierto, «Recursos» navega a la misma dirección y no lo remonta. */
  useEffect(() => {
    const wanted = requestedTab(location.state);

    if (wanted) {
      setTab(wanted);
    }
  }, [location.key, location.state]);
  const tabRefs = useRef<Partial<Record<PanelTab, HTMLButtonElement | null>>>({});
  const [openResourceId, setOpenResourceId] = useState<string | null>(null);
  const openResource = teacherResources.find((resource) => resource.id === openResourceId);

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

  /* Con «Todos», el salón de cada explorador para la lista. */
  const groupNameById = useMemo(
    () =>
      new Map(
        scopedGroups.flatMap((group) => group.students.map((student) => [student.id, group.name]))
      ),
    [scopedGroups]
  );
  const groupNameOf = (id: string) => groupNameById.get(id);

  const catalogLevels =
    catalog.length === 0 ? null : catalog.reduce((total, world) => total + world.levels.length, 0);

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

  const activeIndex = TABS.findIndex((item) => item.key === tab);

  /* Las flechas mueven entre pestañas, como pide el patrón de pestañas de la WAI. */
  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;

    if (step === 0) {
      return;
    }

    event.preventDefault();
    const next = TABS[(activeIndex + step + TABS.length) % TABS.length];
    setTab(next.key);
    tabRefs.current[next.key]?.focus();
  };

  return (
    <div className="px-6 py-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1160px]">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] leading-tight text-tutor-ink">Panel de información</h1>
            <p className="mt-1 text-tutor-ink-soft">
              Cuánto llevan jugado tus exploradores y qué puedes hacer al respecto.
            </p>
          </div>

          {/*
           * Cambiar de alcance SUELTA al explorador: un alumno pertenece a un
           * solo salón, así que mantenerlo elegido dejaría abierta la ficha de
           * alguien que ya no está en la lista de al lado.
           */}
          <label className="flex items-center gap-2.5">
            <span className="text-[13.5px] font-medium text-tutor-ink-soft">Salón</span>
            <span className="relative block w-[240px]">
              <select
                value={selectedGroupId}
                onChange={(event) => navigate(panelPath(event.target.value))}
                className="tutor-field appearance-none pr-9"
              >
                <option value={ALL_GROUPS}>Todos los salones ({groups.length})</option>
                {sortGroups(groups, 'name').map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <ChevronIcon variant="tutor" />
            </span>
          </label>
        </section>

        <div
          role="tablist"
          aria-label="Secciones del panel"
          className="mt-5 flex gap-6 border-b border-tutor-rule"
        >
          {TABS.map((item) => {
            const active = item.key === tab;

            return (
              <button
                key={item.key}
                ref={(node) => {
                  tabRefs.current[item.key] = node;
                }}
                type="button"
                role="tab"
                id={`panel-tab-${item.key}`}
                aria-selected={active}
                aria-controls={`panel-section-${item.key}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setTab(item.key)}
                onKeyDown={handleTabKey}
                className={`tutor-focus -mb-px border-b-2 pb-2.5 pt-1 text-[15px] font-semibold transition-colors ${
                  active
                    ? 'border-tutor-accent text-tutor-accent'
                    : 'border-transparent text-tutor-ink-soft hover:text-tutor-ink'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`panel-section-${tab}`}
          aria-labelledby={`panel-tab-${tab}`}
          className="mt-5"
        >
          {tab === 'progress' ? (
            summary.totalStudents === 0 ? (
              <p className="tutor-card px-4 py-3 text-tutor-ink-soft">
                Todavía no hay exploradores inscritos, así que no hay avance que contar.
              </p>
            ) : summary.activeStudents === 0 ? (
              <p className="rounded-[8px] border border-tutor-warn/30 bg-tutor-warn-soft px-4 py-3 font-semibold text-tutor-warn">
                Ninguno de tus exploradores ha jugado todavía. En cuanto alguno empiece, aquí verás
                cuánto lleva y cuánto le costó.
              </p>
            ) : (
              <>
                <h2 className="sr-only">{progressTitle}</h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatRing
                    title="Han jugado"
                    value={`${summary.activeStudents} de ${summary.totalStudents}`}
                    ratio={ratioOf(summary.activeStudents, summary.totalStudents)}
                    tone="accent"
                  />
                  <StatRing
                    title="Niveles superados"
                    value={`${summary.completedLevels} de ${summary.reachableLevels}`}
                    ratio={ratioOf(summary.completedLevels, summary.reachableLevels)}
                    tone="info"
                  />
                  <StatRing
                    title="Mundos terminados"
                    value={`${summary.completedWorlds} de ${summary.reachableWorlds}`}
                    ratio={ratioOf(summary.completedWorlds, summary.reachableWorlds)}
                    tone="ok"
                  />
                  <StatRing
                    title="Eficiencia media"
                    value={
                      summary.averageBestScore === null ? '—' : `${summary.averageBestScore}/100`
                    }
                    ratio={
                      summary.averageBestScore === null ? null : summary.averageBestScore / 100
                    }
                    tone="warn"
                  />
                </div>

                <p className="mt-2 text-[13.5px] text-tutor-ink-soft">
                  Los que todavía no han entrado cuentan en el total, pero no en el promedio de
                  eficiencia.
                </p>

                <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                  <StudentPicker
                    key={selectedGroupId}
                    students={scopedStudents}
                    selectedId={studentId}
                    onSelect={(id) => navigate(panelPath(selectedGroupId, id))}
                    groupNameOf={selectedGroupId === ALL_GROUPS ? groupNameOf : undefined}
                    totalLevels={catalogLevels}
                  />

                  {selectedStudent ? (
                    <StudentProgressCard
                      student={selectedStudent}
                      catalog={catalog}
                      detail={detail}
                      loading={detailLoading}
                      error={detailError}
                    />
                  ) : (
                    <div className="rounded-[12px] border border-dashed border-tutor-rule-strong bg-tutor-surface px-6 py-12 text-center">
                      <p className="text-[17px] font-semibold text-tutor-ink">
                        Elige un explorador
                      </p>
                      <p className="mt-1 text-tutor-ink-soft">
                        Verás cuánto le costó cada nivel, partida por partida.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )
          ) : null}

          {tab === 'missions' ? (
            <>
              <section>
                <p className="max-w-[80ch] text-[14.5px] text-tutor-ink-soft">
                  Retos personalizados para {scopeLabel}. Dan más experiencia que un nivel normal, y
                  el niño sólo ve las que le asignas.
                </p>

                {/*
                 * Con la ficha de un alumno abierta encima, asignar parecía cosa suya. La
                 * asignación es del salón (0020): se dice para que nadie lo dude.
                 */}
                {selectedStudent ? (
                  <p className="mt-3 rounded-[8px] border border-tutor-info/30 bg-tutor-info-soft px-4 py-2.5 font-semibold text-tutor-info">
                    Las misiones se asignan a {scopeLabel}, no sólo a {selectedStudent.name}.
                  </p>
                ) : null}

                {groups.length === 0 ? (
                  <p className="mt-4 rounded-[8px] border border-tutor-warn/30 bg-tutor-warn-soft px-4 py-3 font-semibold text-tutor-warn">
                    Todavía no tienes ningún salón, así que no hay a quién asignarle una misión.
                    Crea uno y vuelve por aquí.
                  </p>
                ) : null}

                <div className="mt-4">
                  <StoreErrorNotice error={missionsError} variant="tutor" />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
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
                <section className="mt-9">
                  <div className="tutor-section-head">
                    <h2>Quién ha cumplido</h2>
                  </div>

                  <p className="mt-2 text-[14.5px] text-tutor-ink-soft">
                    Misiones asignadas a {selectedGroup.name} y cómo va cada explorador.
                  </p>

                  {selectedGroup.students.length === 0 ? (
                    <p className="tutor-card mt-4 px-4 py-3 text-tutor-ink-soft">
                      Este salón todavía no tiene exploradores inscritos.
                    </p>
                  ) : (
                    <MissionCompletionTable
                      key={selectedGroup.id}
                      students={selectedGroup.students}
                      missions={assignedMissions}
                      completedPairs={completedPairs}
                      onlineIds={onlineStudentIds}
                    />
                  )}
                </section>
              ) : null}
            </>
          ) : null}

          {tab === 'resources' ? (
            <section className="pb-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {teacherResources.map((resource) => (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => setOpenResourceId(resource.id)}
                    className="tutor-card tutor-focus p-4 text-left transition-colors hover:border-tutor-rule-strong hover:bg-tutor-sunken"
                  >
                    <span className="tutor-badge tutor-badge-info tutor-badge-plain">
                      {resource.categoryLabel}
                    </span>

                    <h3 className="mt-2.5 text-[17px] leading-tight text-tutor-ink">
                      {resource.title}
                    </h3>

                    <p className="mt-1.5 text-[14.5px] leading-[1.55] text-tutor-ink-soft">
                      {resource.description}
                    </p>

                    <p className="mt-2.5 text-[14px] text-tutor-ink-soft">
                      {resourceReadMinutes(resource)} min de lectura ·{' '}
                      <span className="font-semibold text-tutor-accent">Leer</span>
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {openResource ? (
        <TeacherResourceDialog resource={openResource} onClose={() => setOpenResourceId(null)} />
      ) : null}
    </div>
  );
};
