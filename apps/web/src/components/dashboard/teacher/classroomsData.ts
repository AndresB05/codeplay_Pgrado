import type {
  ClassGroup,
  ClassGroupStats,
  ClassroomStudent,
  Mission,
  SkillKey,
  SkillReport,
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

/** Umbral a partir del cual se considera que un niño domina la habilidad. */
const MASTERY_THRESHOLD = 70;

const SKILL_DEFINITIONS: { key: SkillKey; label: string; description: string }[] = [
  {
    key: 'sequences',
    label: 'Secuencias',
    description: 'Ordenar pasos en el orden correcto para llegar a una meta.',
  },
  {
    key: 'loops',
    label: 'Bucles',
    description: 'Repetir acciones sin escribirlas una y otra vez.',
  },
  {
    key: 'conditionals',
    label: 'Condicionales',
    description: 'Tomar decisiones distintas según lo que pasa en el juego.',
  },
  {
    key: 'debugging',
    label: 'Depuración',
    description: 'Encontrar el error en una solución y corregirlo.',
  },
  {
    key: 'decomposition',
    label: 'Descomposición',
    description: 'Partir un problema grande en pedazos manejables.',
  },
];

/**
 * Promedia el dominio de cada habilidad entre los niños que ya han jugado.
 * Los niños sin actividad quedan fuera: si contaran, hundirían el promedio y
 * el tutor leería un problema de aprendizaje donde solo hay ausencia.
 */
export const getSkillReports = (groups: ClassGroup[]): SkillReport[] => {
  const evaluatedStudents = groups
    .flatMap((group) => group.students)
    .filter((student) => student.hoursSinceLastActivity !== null);

  return SKILL_DEFINITIONS.map((definition) => {
    if (evaluatedStudents.length === 0) {
      return { ...definition, mastery: 0, studentsMastered: 0, studentsEvaluated: 0 };
    }

    const total = evaluatedStudents.reduce(
      (sum, student) => sum + student.skills[definition.key],
      0
    );

    const studentsMastered = evaluatedStudents.filter(
      (student) => student.skills[definition.key] >= MASTERY_THRESHOLD
    ).length;

    return {
      ...definition,
      mastery: Math.round(total / evaluatedStudents.length),
      studentsMastered,
      studentsEvaluated: evaluatedStudents.length,
    };
  });
};

export const getSkillLabel = (skill: SkillKey): string => {
  return SKILL_DEFINITIONS.find((definition) => definition.key === skill)?.label ?? skill;
};

export const missionCatalog: Mission[] = [
  {
    id: 'm1',
    title: 'La ruta del leopardo',
    description: 'Ordena los pasos para cruzar la selva sin salirse del camino.',
    skill: 'sequences',
    difficultyLabel: 'Fácil',
    estimatedMinutes: 10,
  },
  {
    id: 'm2',
    title: 'Cosecha en bucle',
    description: 'Recoge diez frutas repitiendo el menor número de instrucciones.',
    skill: 'loops',
    difficultyLabel: 'Fácil',
    estimatedMinutes: 15,
  },
  {
    id: 'm3',
    title: 'El puente que decide',
    description: 'Cruza solo si el puente es seguro; si no, busca otra ruta.',
    skill: 'conditionals',
    difficultyLabel: 'Intermedio',
    estimatedMinutes: 20,
  },
  {
    id: 'm4',
    title: 'Caza del error',
    description: 'El robot se sale de la ruta: encuentra la instrucción equivocada.',
    skill: 'debugging',
    difficultyLabel: 'Intermedio',
    estimatedMinutes: 20,
  },
  {
    id: 'm5',
    title: 'Plan maestro',
    description: 'Divide una misión larga en tres misiones pequeñas y resuélvelas.',
    skill: 'decomposition',
    difficultyLabel: 'Difícil',
    estimatedMinutes: 30,
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
