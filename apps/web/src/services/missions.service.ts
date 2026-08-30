import { AppError } from '../errors/AppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';

type MissionAssignmentRow = Database['public']['Tables']['mission_assignments']['Row'];

/**
 * Una misión asignada a un salón. `missionKey` es texto sin clave ajena: el
 * catálogo vive en el cliente y no hay tabla a la que apuntar, así que una clave
 * puede no corresponder a ninguna misión conocida y quien pinta la descarta.
 */
export interface MissionAssignment {
  id: MissionAssignmentRow['id'];
  groupId: MissionAssignmentRow['group_id'];
  missionKey: MissionAssignmentRow['mission_key'];
  assignedAt: MissionAssignmentRow['assigned_at'];
}

export interface MissionsService {
  listAssignments: () => ServiceResult<MissionAssignment[]>;
  assignMission: (missionKey: string, groupIds: string[], tutorId: string) => ServiceResult<null>;
  unassignMission: (missionKey: string, groupIds: string[]) => ServiceResult<null>;
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
  };
};

export const missionsService: MissionsService = {
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
   * `ignoreDuplicates` y no un `insert` a secas: con «Todos» elegido, un tutor
   * que ya tenía la misión en uno de sus salones vería morir la operación entera
   * con `23505` por una fila que ya estaba bien. En PostgREST esto es un
   * `on conflict do nothing`, así que no exige el permiso de `update`.
   */
  async assignMission(
    missionKey: string,
    groupIds: string[],
    tutorId: string
  ): ServiceResult<null> {
    if (groupIds.length === 0) {
      return { data: null, error: null };
    }

    const { error } = await supabase.from('mission_assignments').upsert(
      groupIds.map((groupId) => ({
        group_id: groupId,
        mission_key: missionKey,
        assigned_by: tutorId,
      })),
      { onConflict: 'group_id,mission_key', ignoreDuplicates: true }
    );

    if (error) {
      return {
        data: null,
        error: missionError(error, 'No se pudo asignar la misión.', 'missions_assign_error'),
      };
    }

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
};
