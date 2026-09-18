import type { CatalogWorld } from '../../../services/studentProgress.service';
import type {
  ClassGroup,
  ClassGroupStats,
  ClassroomStudent,
  LevelAttempt,
  LevelProgress,
  Mission,
  SkillKey,
  StudentProgressDetail,
  TeacherResource,
} from '../../../types/classroom.types';

export const findClassGroup = (
  groups: ClassGroup[],
  groupId: string | undefined
): ClassGroup | null => {
  if (!groupId) {
    return null;
  }

  return groups.find((group) => group.id === groupId) ?? null;
};

/** Convierte horas en una etiqueta legible: "hace 3 horas", "hace 2 días". */
export const formatLastActivity = (hoursSinceLastActivity: number | null): string => {
  if (hoursSinceLastActivity === null) {
    return 'Sin actividad';
  }

  if (hoursSinceLastActivity < 1) {
    return 'hace un momento';
  }

  if (hoursSinceLastActivity < 24) {
    const hours = Math.round(hoursSinceLastActivity);

    return hours === 1 ? 'hace 1 hora' : `hace ${hours} horas`;
  }

  const days = Math.round(hoursSinceLastActivity / 24);

  return days === 1 ? 'hace 1 día' : `hace ${days} días`;
};

const getMostFrequentWorld = (students: ClassroomStudent[]): string => {
  const counters = new Map<string, number>();

  students.forEach((student) => {
    if (!student.currentWorld) {
      return;
    }

    counters.set(student.currentWorld, (counters.get(student.currentWorld) ?? 0) + 1);
  });

  let topWorld = '-';
  let topCount = 0;

  counters.forEach((count, world) => {
    if (count > topCount) {
      topWorld = world;
      topCount = count;
    }
  });

  return topWorld;
};

export const getClassGroupStats = (group: ClassGroup): ClassGroupStats => {
  const activeToday = group.students.filter(
    (student) => (student.hoursSinceLastActivity ?? Infinity) <= 24
  ).length;

  const bestStreak = group.students.reduce(
    (best, student) => Math.max(best, student.streakDays ?? 0),
    0
  );

  /*
   * El recuento manda sobre la lista: del salón ajeno el niño sabe cuántos hay
   * dentro, pero no quiénes son, así que `students` viene vacío y contarlo
   * daría siempre cero cupos ocupados.
   */
  return {
    totalStudents: group.memberCount,
    freeSeats: Math.max(group.capacity - group.memberCount, 0),
    activeToday,
    averageWorldLabel: getMostFrequentWorld(group.students),
    bestStreak,
  };
};

/** Lo que el panel del tutor cuenta de un alcance: un salón, o todos. */
export interface ClassroomProgressSummary {
  /** Exploradores inscritos en el alcance. */
  totalStudents: number;
  /** Los que tienen alguna partida. */
  activeStudents: number;
  completedLevels: number;
  completedWorlds: number;
  /** Niveles que el alcance entero podría superar. */
  reachableLevels: number;
  /** Mundos que el alcance entero podría terminar. */
  reachableWorlds: number;
  /** Marca media de eficiencia de lo superado. `null` si no hay nada superado. */
  averageBestScore: number | null;
}

/**
 * Cuenta el progreso de un alcance. El denominador es el catálogo entero por
 * cada explorador inscrito —también por los que no han jugado—, porque la
 * pregunta que contesta es cuánto le queda al salón, no cuánto le queda a quien
 * ya empezó.
 *
 * La marca media, en cambio, promedia sólo entre quienes han superado algo: un
 * cero por no haber jugado no habla de eficiencia, y hundiría el número hasta
 * hacerlo decir lo contrario de lo que pasa.
 */
export const getClassroomProgressSummary = (
  groups: ClassGroup[],
  catalog: CatalogWorld[]
): ClassroomProgressSummary => {
  const catalogLevels = catalog.reduce((total, world) => total + world.levels.length, 0);
  const students = groups.flatMap((group) => group.students);
  const scored = students.filter((student) => student.averageBestScore !== null);

  return {
    totalStudents: students.length,
    activeStudents: students.filter((student) => student.attemptedLevels > 0).length,
    completedLevels: students.reduce((total, student) => total + student.completedLevels, 0),
    completedWorlds: students.reduce((total, student) => total + student.completedWorlds, 0),
    reachableLevels: students.length * catalogLevels,
    reachableWorlds: students.length * catalog.length,
    averageBestScore:
      scored.length === 0
        ? null
        : Math.round(
            scored.reduce((total, student) => total + (student.averageBestScore ?? 0), 0) /
              scored.length
          ),
  };
};

/** Un nivel en la ficha del explorador: el del catálogo, con lo que haya jugado. */
export interface StudentLevelProgress {
  levelId: string;
  title: string;
  /**
   * `null` mientras no lo haya empezado. No es un hueco: `user_progress` no
   * tiene fila hasta la primera partida, y ese vacío es justo lo que el tutor
   * viene a ver.
   */
  progress: LevelProgress | null;
  attempts: LevelAttempt[];
}

/** Un mundo en la ficha del explorador, con sus niveles y cuántos lleva. */
export interface StudentWorldProgress {
  worldId: string;
  title: string;
  completedLevels: number;
  /** Los que esta ficha lista, que son los publicados salvo el caso de abajo. */
  totalLevels: number;
  levels: StudentLevelProgress[];
}

/**
 * Cruza el catálogo publicado con lo que el explorador lleva jugado.
 *
 * Recorre el CATÁLOGO y no el progreso, que es lo que hace aparecer los niveles
 * que nunca empezó y los mundos que no ha tocado. Un mundo intacto sale con su
 * nombre y su cero, no desaparece.
 */
export const buildWorldProgress = (
  catalog: CatalogWorld[],
  detail: StudentProgressDetail
): StudentWorldProgress[] => {
  const progressByLevel = new Map(detail.levels.map((level) => [level.levelId, level]));
  const placed = new Set<string>();

  const buildLevel = (levelId: string, title: string): StudentLevelProgress => {
    placed.add(levelId);

    return {
      levelId,
      title,
      progress: progressByLevel.get(levelId) ?? null,
      attempts: detail.attemptsByLevel[levelId] ?? [],
    };
  };

  const worlds = catalog.map((world) => ({
    worldId: world.worldId,
    title: world.title,
    levels: world.levels.map((level) => buildLevel(level.levelId, level.title)),
  }));

  /*
   * Lo jugado que el catálogo ya no nombra no se pierde: despublicar un nivel
   * borraría de la vista del profesor el historial de un niño, y sin ningún
   * error que lo delate. Va al final de su mundo, y si el mundo tampoco está
   * publicado, a un grupo propio al final de la lista.
   */
  const worldsById = new Map(worlds.map((world) => [world.worldId, world]));

  detail.levels.forEach((level) => {
    if (placed.has(level.levelId)) {
      return;
    }

    const orphan = buildLevel(level.levelId, level.levelTitle);
    const world = worldsById.get(level.worldId);

    if (world) {
      world.levels.push(orphan);

      return;
    }

    const added = { worldId: level.worldId, title: level.worldTitle, levels: [orphan] };

    worlds.push(added);
    worldsById.set(added.worldId, added);
  });

  return worlds.map((world) => ({
    ...world,
    completedLevels: world.levels.filter((level) => level.progress?.completed).length,
    totalLevels: world.levels.length,
  }));
};

/**
 * Un mundo terminado es aquel cuyos niveles están todos superados, la misma
 * regla que `classroom_student_activity` aplica en el servidor. Se calcula aquí
 * porque aquella vista da un número por alumno y la ficha lo necesita por mundo;
 * si la regla cambia, cambia en los dos sitios.
 */
export const isWorldFinished = (world: StudentWorldProgress): boolean =>
  world.totalLevels > 0 && world.completedLevels >= world.totalLevels;

/*
 * Con qué rótulo se le enseña al tutor cada clave de `Mission.skill`. Fue la
 * tabla de los reportes de habilidades hasta que se retiraron el 18-sep-2026;
 * lo único que sobrevive es el nombre, porque el catálogo de misiones sigue
 * etiquetando con él. Las descripciones se fueron con las barras.
 */
const SKILL_LABELS: Record<SkillKey, string> = {
  sequences: 'Secuencias',
  loops: 'Bucles',
  conditionals: 'Condicionales',
  debugging: 'Depuración',
  decomposition: 'Descomposición',
};

export const getSkillLabel = (skill: SkillKey): string => SKILL_LABELS[skill] ?? skill;

export const missionCatalog: Mission[] = [
  {
    id: 'm1',
    title: 'La ruta del leopardo',
    description: 'Ordena los pasos para cruzar la selva sin salirse del camino.',
    skill: 'sequences',
    difficultyLabel: 'Fácil',
    estimatedMinutes: 10,
    xpReward: 300,
  },
  {
    id: 'm2',
    title: 'Cosecha en bucle',
    description: 'Recoge diez frutas repitiendo el menor número de instrucciones.',
    skill: 'loops',
    difficultyLabel: 'Fácil',
    estimatedMinutes: 15,
    xpReward: 300,
  },
  {
    id: 'm3',
    title: 'El puente que decide',
    description: 'Cruza solo si el puente es seguro; si no, busca otra ruta.',
    skill: 'conditionals',
    difficultyLabel: 'Intermedio',
    estimatedMinutes: 20,
    xpReward: 400,
  },
  {
    id: 'm4',
    title: 'Caza del error',
    description: 'El robot se sale de la ruta: encuentra la instrucción equivocada.',
    skill: 'debugging',
    difficultyLabel: 'Intermedio',
    estimatedMinutes: 20,
    xpReward: 400,
  },
  {
    id: 'm5',
    title: 'Plan maestro',
    description: 'Divide una misión larga en tres misiones pequeñas y resuélvelas.',
    skill: 'decomposition',
    difficultyLabel: 'Difícil',
    estimatedMinutes: 30,
    xpReward: 500,
  },
];

export const teacherResources: TeacherResource[] = [
  {
    id: 'r1',
    title: 'Cómo se resuelven los acertijos',
    description:
      'Recorrido por la mecánica de los mundos y qué se espera que el niño descubra en cada uno.',
    categoryLabel: 'Guía de la plataforma',
    readMinutes: 6,
  },
  {
    id: 'r2',
    title: 'Qué significan las medallas',
    description:
      'Cada medalla premia una habilidad concreta. Aprende a leerlas para saber dónde apoyar.',
    categoryLabel: 'Logros',
    readMinutes: 4,
  },
  {
    id: 'r3',
    title: 'Acompañar sin dar la respuesta',
    description:
      'Preguntas que puedes hacerle al niño cuando se atasca, sin resolverle el acertijo.',
    categoryLabel: 'Acompañamiento',
    readMinutes: 8,
  },
  {
    id: 'r4',
    title: 'Leer los reportes de habilidades',
    description:
      'Cómo interpretar el dominio por habilidad y cuándo conviene asignar una misión extra.',
    categoryLabel: 'Guía de la plataforma',
    readMinutes: 5,
  },
];

/** "hace 3 horas", "hace 2 días", a partir de una fecha ISO. */
export const formatRelativeTime = (iso: string): string => {
  const elapsedMs = Date.now() - new Date(iso).getTime();

  return formatLastActivity(Math.max(elapsedMs, 0) / (1000 * 60 * 60));
};

/**
 * Coincide si la consulta es exactamente el ID público del salón, o si aparece
 * dentro del nombre. Así el mismo buscador sirve para el listado global y para
 * localizar un salón concreto por su ID.
 */
export const matchesGroupSearch = (group: ClassGroup, query: string): boolean => {
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) {
    return true;
  }

  if (group.publicId.toLowerCase() === normalized) {
    return true;
  }

  return group.name.toLowerCase().includes(normalized);
};

/** `true` si la consulta apunta a un salón concreto por su ID público. */
export const isExactIdSearch = (groups: ClassGroup[], query: string): boolean => {
  const normalized = query.trim().toLowerCase();

  return (
    normalized.length > 0 && groups.some((group) => group.publicId.toLowerCase() === normalized)
  );
};

const AVATAR_TONES = [
  'bg-[#EFE5FF] text-[#7C3AED]',
  'bg-[#FFE8CC] text-[#C97A00]',
  'bg-[#DCF5F2] text-[#0F948C]',
  'bg-[#FFE1EC] text-[#C2185B]',
  'bg-[#E4ECFF] text-[#3B5BDB]',
];

export const pickAvatarTone = (seed: string): string => {
  const index = Math.abs(seed.split('').reduce((hash, char) => hash * 31 + char.charCodeAt(0), 7));

  return AVATAR_TONES[index % AVATAR_TONES.length];
};

export const buildInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const randomSuffix = (length: number): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(
    ''
  );
};

/** ID público legible y único dentro de los salones existentes. */
export const generatePublicId = (existingGroups: Pick<ClassGroup, 'publicId'>[]): string => {
  const taken = new Set(existingGroups.map((group) => group.publicId));

  let candidate = `CP-${randomSuffix(4)}`;

  while (taken.has(candidate)) {
    candidate = `CP-${randomSuffix(4)}`;
  }

  return candidate;
};
