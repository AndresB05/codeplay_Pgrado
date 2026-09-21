import { AppError } from '../errors/AppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { DifficultyLabel, Mission } from '../types/classroom.types';
import type { Database } from '../types/database.types';

type MissionAssignmentRow = Database['public']['Tables']['mission_assignments']['Row'];
type MissionCatalogRow = Database['public']['Tables']['mission_catalog']['Row'];
type MissionCompletionRow = Database['public']['Tables']['mission_completions']['Row'];

/**
 * Una misión asignada a un salón. Desde que el catálogo está en la base,
 * `missionKey` **tiene clave ajena** contra `mission_catalog`, así que una
 * asignación siempre apunta a una misión que existe.
 */
export interface MissionAssignment {
  id: MissionAssignmentRow['id'];
  groupId: MissionAssignmentRow['group_id'];
  missionKey: MissionAssignmentRow['mission_key'];
  assignedAt: MissionAssignmentRow['assigned_at'];
  /** Último día para cumplirla, en día de Colombia; `null` es sin límite. */
  dueDate: MissionAssignmentRow['due_date'];
}

/**
 * Una misión que un explorador ya cumplió. Lleva **el salón donde ocurrió**, que
 * se guarda y no se deriva: un niño que cambie de salón haría desaparecer lo
 * cumplido de los informes de su antiguo tutor.
 */
export interface MissionCompletion {
  userId: MissionCompletionRow['user_id'];
  missionKey: MissionCompletionRow['mission_key'];
  groupId: MissionCompletionRow['group_id'];
  awardedXp: MissionCompletionRow['awarded_xp'];
  completedAt: MissionCompletionRow['completed_at'];
}

export interface MissionsService {
  listCatalog: () => ServiceResult<Mission[]>;
  listAssignments: () => ServiceResult<MissionAssignment[]>;
  listCompletions: () => ServiceResult<MissionCompletion[]>;
  assignMission: (
    missionKey: string,
    groupIds: string[],
    dueDate: string | null
  ) => ServiceResult<null>;
  unassignMission: (missionKey: string, groupIds: string[]) => ServiceResult<null>;
  subscribeToAssignments: (onChange: () => void) => () => void;
}

/*
 * Los motivos que levanta la base vienen en inglés y la interfaz es en español,
 * así que se traducen aquí por código, como en `classrooms.service.ts`, y el
 * texto original viaja como causa para quien depure.
 */
const ERROR_MESSAGES: Record<string, string> = {
  '23505': 'Esa misión ya estaba asignada a ese salón.',
  '23503': 'Ese salón ya no existe.',
  '42501': 'No tienes permiso para asignar misiones en ese salón.',
  '42P17': 'El servidor no pudo comprobar los permisos. Avisa a quien mantiene la plataforma.',
  ZC020: 'Esa fecha ya pasó. Elige hoy o un día posterior.',
};

const readErrorCode = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code?: unknown };

    return typeof code === 'string' ? code : undefined;
  }

  return undefined;
};

const missionError = (error: unknown, fallbackMessage: string, fallbackCode: string): AppError => {
  const code = readErrorCode(error);

  return new AppError(
    (code && ERROR_MESSAGES[code]) || fallbackMessage,
    code ?? fallbackCode,
    error
  );
};

const mapAssignmentRow = (assignment: MissionAssignmentRow): MissionAssignment => {
  return {
    id: assignment.id,
    groupId: assignment.group_id,
    missionKey: assignment.mission_key,
    assignedAt: assignment.assigned_at,
    dueDate: assignment.due_date,
  };
};

/*
 * `difficulty_label` es `text` con un `check` en la base, así que llega como
 * `string`. Se estrecha aquí en vez de confiar: un valor que el `check` no
 * permitiría no puede existir, pero el tipo generado no lo sabe.
 */
const mapCatalogRow = (mission: MissionCatalogRow): Mission => {
  return {
    key: mission.mission_key,
    title: mission.title,
    description: mission.description,
    difficultyLabel: mission.difficulty_label as DifficultyLabel,
    xpReward: mission.awarded_xp,
  };
};

const mapCompletionRow = (completion: MissionCompletionRow): MissionCompletion => {
  return {
    userId: completion.user_id,
    missionKey: completion.mission_key,
    groupId: completion.group_id,
    awardedXp: completion.awarded_xp,
    completedAt: completion.completed_at,
  };
};

export const missionsService: MissionsService = {
  /**
   * El catálogo entero, que es contenido y no dato de nadie: lo leen igual el
   * tutor —para elegir qué asignar— y el niño —para la tarjeta de lo asignado—.
   *
   * Vive en la base desde que las misiones se pueden cumplir. Con una lista en
   * SQL para conceder y otra en TypeScript para pintar, las dos se separan en
   * cuanto alguien toque una.
   */
  async listCatalog(): ServiceResult<Mission[]> {
    const { data, error } = await supabase
      .from('mission_catalog')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return {
        data: null,
        error: missionError(
          error,
          'No se pudo cargar el catálogo de misiones.',
          'missions_catalog_error'
        ),
      };
    }

    return { data: data.map(mapCatalogRow), error: null };
  },

  /**
   * Una sola lectura sirve a los dos roles: la RLS devuelve las del salón del
   * niño o las de los salones del tutor según quién pregunte, así que no hace
   * falta pasarle ni el rol ni el salón. De ahí sale gratis que un niño sin
   * salón reciba cero filas.
   */
  async listAssignments(): ServiceResult<MissionAssignment[]> {
    const { data, error } = await supabase
      .from('mission_assignments')
      .select('*')
      .order('assigned_at', { ascending: true });

    if (error) {
      return {
        data: null,
        error: missionError(
          error,
          'No se pudieron cargar las misiones asignadas.',
          'missions_list_error'
        ),
      };
    }

    return { data: data.map(mapAssignmentRow), error: null };
  },

  /**
   * Lo cumplido que quien consulta puede ver: lo suyo si es niño, lo de sus
   * alumnos si es tutor. Quién ve qué lo decide la RLS, como en
   * `listAssignments()`.
   */
  async listCompletions(): ServiceResult<MissionCompletion[]> {
    const { data, error } = await supabase
      .from('mission_completions')
      .select('*')
      .order('completed_at', { ascending: true });

    if (error) {
      return {
        data: null,
        error: missionError(
          error,
          'No se pudo cargar quién ha cumplido las misiones.',
          'missions_completions_error'
        ),
      };
    }

    return { data: data.map(mapCompletionRow), error: null };
  },

  /**
   * PASA POR UNA RPC Y NO POR UN `upsert`, desde que las misiones se cumplen: al
   * asignar hay que dar por cumplida la misión a quien ya satisfaga su
   * condición, y eso escribe en filas de **otros usuarios** —sus cumplimientos y
   * su XP—, que el rol del tutor no puede tocar por ninguna vía directa.
   *
   * Sin esa puesta al día, un salón donde varios ya terminaron el mundo saldría
   * entero en «Pendiente» hasta que cada uno volviera a jugar, que es el síntoma
   * que este paso vino a quitar.
   *
   * El tutor ya no se pasa: la función lee `auth.uid()` por dentro, que es lo
   * que hace imposible asignar en nombre de otro. Dentro sigue habiendo un
   * `on conflict do nothing`, así que mandar salones que ya la tienen no falla.
   */
  async assignMission(
    missionKey: string,
    groupIds: string[],
    dueDate: string | null
  ): ServiceResult<null> {
    if (groupIds.length === 0) {
      return { data: null, error: null };
    }

    const { error } = await supabase.rpc('assign_mission_to_groups', {
      input_group_ids: groupIds,
      input_mission_key: missionKey,
      input_due_date: dueDate ?? undefined,
    });

    if (error) {
      return {
        data: null,
        error: missionError(error, 'No se pudo asignar la misión.', 'missions_assign_error'),
      };
    }

    /*
     * La respuesta trae `assigned`, `caught_up` y `missions_error`. No se
     * devuelve: la asignación salió bien aunque la puesta al día fallara, y
     * decirle al tutor que falló algo cuando su misión está asignada sería
     * mentirle. El motivo queda en la respuesta para quien depure por REST, que
     * es lo mismo que hace `achievements_error` al guardar una partida.
     */
    return { data: null, error: null };
  },

  async unassignMission(missionKey: string, groupIds: string[]): ServiceResult<null> {
    if (groupIds.length === 0) {
      return { data: null, error: null };
    }

    const { error } = await supabase
      .from('mission_assignments')
      .delete()
      .eq('mission_key', missionKey)
      .in('group_id', groupIds);

    if (error) {
      return {
        data: null,
        error: missionError(error, 'No se pudo retirar la misión.', 'missions_unassign_error'),
      };
    }

    return { data: null, error: null };
  },

  /**
   * Avisa de que cambiaron las asignaciones, para que quien escucha vuelva a
   * consultar. Sin parámetro de usuario, por lo mismo que `listAssignments()`
   * tampoco lo lleva: una sola suscripción sirve a los dos roles y quién recibe
   * qué lo decide la RLS.
   */
  subscribeToAssignments(onChange: () => void): () => void {
    /* Topic único por llamada: ver `subscribeToClassrooms`. */
    const channel = supabase.channel(`mission-assignments:${crypto.randomUUID()}`);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'mission_assignments' },
      () => {
        onChange();
      }
    );

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },
};
