import { AppError } from '../errors/AppError';
import {
  buildInitials,
  generatePublicId,
  pickAvatarTone,
} from '../components/dashboard/teacher/classroomsData';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type {
  ClassGroup,
  ClassroomStudent,
  CreateGroupInput,
  JoinRequest,
  SkillKey,
  StudentMembership,
} from '../types/classroom.types';

type DirectoryRow = Database['public']['Views']['class_group_directory']['Row'];
type RosterRow = Database['public']['Views']['classroom_roster']['Row'];
type JoinRequestRow = Database['public']['Tables']['join_requests']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/** Estado completo de salones para quien consulta, sea tutor o niño. */
export interface ClassroomsSnapshot {
  groups: ClassGroup[];
  membership: StudentMembership;
}

export interface ClassroomsService {
  getTutorSnapshot: (tutorId: string) => ServiceResult<ClassroomsSnapshot>;
  getStudentSnapshot: (studentId: string) => ServiceResult<ClassroomsSnapshot>;
  createGroup: (input: CreateGroupInput, tutorId: string) => ServiceResult<ClassGroup>;
  deleteGroup: (groupId: string) => ServiceResult<null>;
  removeStudent: (groupId: string, studentId: string) => ServiceResult<null>;
  acceptRequest: (requestId: string) => ServiceResult<null>;
  rejectRequest: (requestId: string) => ServiceResult<null>;
  requestJoin: (groupId: string, studentId: string) => ServiceResult<null>;
  cancelJoinRequest: (studentId: string) => ServiceResult<null>;
  leaveGroup: (studentId: string) => ServiceResult<null>;
  subscribeToClassrooms: (userId: string, onChange: () => void) => () => void;
}

const EMPTY_MEMBERSHIP: StudentMembership = { status: 'none', groupId: null };

const EMPTY_SKILLS: Record<SkillKey, number> = {
  sequences: 0,
  loops: 0,
  conditionals: 0,
  debugging: 0,
  decomposition: 0,
};

/** Cuántas veces se reintenta un ID público antes de rendirse. */
const PUBLIC_ID_ATTEMPTS = 3;

/** Violación de restricción única en PostgreSQL. */
const UNIQUE_VIOLATION = '23505';

/**
 * Tratamiento genérico para quien no tiene nombre en su perfil. Vive aquí porque
 * lo estrenó la lista del salón, y se exporta para que el panel del niño enseñe
 * el mismo: dos literales acabarían llamando de dos maneras a la misma persona.
 */
export const FALLBACK_STUDENT_NAME = 'Explorador';

/*
 * El del tutor, y vive aquí por el mismo motivo que el del niño: llega a la base.
 * `CreateGroupForm` lo recibe como valor por defecto y lo escribe en
 * `classrooms.teacher_name` si el tutor deja el campo vacío.
 */
export const FALLBACK_TEACHER_NAME = 'Sr. Robot';

/*
 * Los mensajes que levanta la base vienen en inglés —«Classroom is full»— y
 * desde el paso 10 se le enseñan al tutor tal cual aparecerían. La interfaz es
 * en español, así que el motivo se traduce aquí por código y el texto original
 * viaja como causa para quien depure.
 */
const ERROR_MESSAGES: Record<string, string> = {
  '23514': 'El salón está lleno. Quita a algún explorador o amplía los cupos.',
  '23505': 'Ese explorador ya pertenece a un salón.',
  '22023': 'Esa solicitud ya estaba resuelta.',
  P0002: 'Esa solicitud ya no existe.',
  '42501': 'No tienes permiso para hacer eso.',
  '42P17': 'El servidor no pudo comprobar los permisos. Avisa a quien mantiene la plataforma.',
};

const readErrorCode = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code?: unknown };

    return typeof code === 'string' ? code : undefined;
  }

  return undefined;
};

/** Error de salones con mensaje en español, listo para pintarse. */
const classroomError = (
  error: unknown,
  fallbackMessage: string,
  fallbackCode: string
): AppError => {
  const code = readErrorCode(error);

  return new AppError(
    (code && ERROR_MESSAGES[code]) || fallbackMessage,
    code ?? fallbackCode,
    error
  );
};

/*
 * Las columnas de una vista llegan como anulables aunque la consulta nunca
 * devuelva nulos: PostgreSQL no propaga la nulabilidad de la tabla de origen a
 * la vista, y el generador de tipos se cura en salud. De ahí que todo lo que
 * sale de las dos vistas pase por aquí.
 */
const mapDirectoryRow = (row: DirectoryRow): ClassGroup => ({
  id: row.id ?? '',
  publicId: row.public_id ?? '',
  name: row.name ?? '',
  gradeLabel: row.grade_label ?? '',
  teacherName: row.teacher_name ?? '',
  capacity: row.capacity ?? 0,
  memberCount: row.member_count ?? 0,
  students: [],
  pendingRequests: [],
});

/*
 * El mundo actual, la última actividad y el dominio por habilidad no existen en
 * la base: ninguna tabla de progreso está asociada a un salón. Viajan vacíos a
 * propósito, y es el paso 17 quien decide qué historial ve el tutor.
 */
const mapRosterRow = (row: RosterRow): ClassroomStudent => {
  const name = row.full_name || FALLBACK_STUDENT_NAME;
  const id = row.student_id ?? '';

  return {
    id,
    name,
    initials: buildInitials(name),
    avatarTone: pickAvatarTone(id),
    currentWorld: null,
    hoursSinceLastActivity: null,
    streakDays: row.current_streak ?? 0,
    xp: row.total_xp ?? 0,
    skills: { ...EMPTY_SKILLS },
  };
};

const mapJoinRequestRow = (row: JoinRequestRow, profile: ProfileRow | undefined): JoinRequest => {
  const name = profile?.full_name || FALLBACK_STUDENT_NAME;

  return {
    id: row.id,
    studentId: row.student_id,
    studentName: name,
    initials: buildInitials(name),
    avatarTone: pickAvatarTone(row.student_id),
    requestedAtIso: row.requested_at,
  };
};

const groupById = <T>(rows: T[], key: (row: T) => string): Map<string, T[]> => {
  const grouped = new Map<string, T[]>();

  rows.forEach((row) => {
    const id = key(row);
    const bucket = grouped.get(id);

    if (bucket) {
      bucket.push(row);
    } else {
      grouped.set(id, [row]);
    }
  });

  return grouped;
};

export const classroomsService: ClassroomsService = {
  async getTutorSnapshot(tutorId: string): ServiceResult<ClassroomsSnapshot> {
    const directory = await supabase
      .from('class_group_directory')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('name');

    if (directory.error) {
      return {
        data: null,
        error: classroomError(
          directory.error,
          'No se pudieron cargar tus salones.',
          'classrooms_get_error'
        ),
      };
    }

    const groups = (directory.data ?? []).map(mapDirectoryRow);
    const groupIds = groups.map((group) => group.id);

    if (groupIds.length === 0) {
      return { data: { groups, membership: EMPTY_MEMBERSHIP }, error: null };
    }

    const [roster, requests] = await Promise.all([
      supabase.from('classroom_roster').select('*').in('group_id', groupIds),
      supabase
        .from('join_requests')
        .select('*')
        .in('group_id', groupIds)
        .eq('status', 'pending')
        .order('requested_at'),
    ]);

    const readError = roster.error ?? requests.error;

    if (readError) {
      return {
        data: null,
        error: classroomError(
          readError,
          'No se pudieron cargar los datos de tus salones.',
          'classrooms_get_error'
        ),
      };
    }

    /*
     * El perfil del solicitante va en una consulta aparte porque
     * `join_requests.student_id` apunta a `auth.users`, no a `profiles`: sin
     * clave ajena entre las dos, PostgREST no puede incrustarlo.
     */
    const requestRows = requests.data ?? [];
    const requesterIds = [...new Set(requestRows.map((row) => row.student_id))];
    const profiles =
      requesterIds.length > 0
        ? await supabase.from('profiles').select('*').in('id', requesterIds)
        : { data: [] as ProfileRow[], error: null };

    if (profiles.error) {
      return {
        data: null,
        error: classroomError(
          profiles.error,
          'No se pudieron cargar los nombres de los solicitantes.',
          'classrooms_get_error'
        ),
      };
    }

    const profilesById = new Map((profiles.data ?? []).map((row) => [row.id, row]));
    const rosterByGroup = groupById(roster.data ?? [], (row) => row.group_id ?? '');
    const requestsByGroup = groupById(requestRows, (row) => row.group_id);

    const composed = groups.map((group) => ({
      ...group,
      students: (rosterByGroup.get(group.id) ?? []).map(mapRosterRow),
      pendingRequests: (requestsByGroup.get(group.id) ?? []).map((row) =>
        mapJoinRequestRow(row, profilesById.get(row.student_id))
      ),
    }));

    return { data: { groups: composed, membership: EMPTY_MEMBERSHIP }, error: null };
  },

  async getStudentSnapshot(studentId: string): ServiceResult<ClassroomsSnapshot> {
    const [directory, membership, lastRequest] = await Promise.all([
      supabase.from('class_group_directory').select('*').order('name'),
      supabase.from('class_memberships').select('*').eq('student_id', studentId).maybeSingle(),
      /*
       * La última por fecha, no «la suya»: un niño rechazado que vuelve a pedir
       * entrar deja dos filas para el mismo par, y un `single()` moriría con
       * PGRST116 en cuanto eso ocurre.
       */
      supabase
        .from('join_requests')
        .select('*')
        .eq('student_id', studentId)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const readError = directory.error ?? membership.error ?? lastRequest.error;

    if (readError) {
      return {
        data: null,
        error: classroomError(
          readError,
          'No se pudieron cargar los salones.',
          'classrooms_get_error'
        ),
      };
    }

    const groups = (directory.data ?? []).map(mapDirectoryRow);

    let studentMembership: StudentMembership = EMPTY_MEMBERSHIP;

    if (membership.data) {
      studentMembership = { status: 'member', groupId: membership.data.group_id };
    } else if (lastRequest.data?.status === 'pending') {
      studentMembership = { status: 'pending', groupId: lastRequest.data.group_id };
    }

    if (studentMembership.status !== 'member' || !studentMembership.groupId) {
      return { data: { groups, membership: studentMembership }, error: null };
    }

    const roster = await supabase
      .from('classroom_roster')
      .select('*')
      .eq('group_id', studentMembership.groupId);

    if (roster.error) {
      return {
        data: null,
        error: classroomError(
          roster.error,
          'No se pudieron cargar tus compañeros de salón.',
          'classrooms_get_error'
        ),
      };
    }

    const composed = groups.map((group) =>
      group.id === studentMembership.groupId
        ? { ...group, students: (roster.data ?? []).map(mapRosterRow) }
        : group
    );

    return { data: { groups: composed, membership: studentMembership }, error: null };
  },

  async createGroup(input: CreateGroupInput, tutorId: string): ServiceResult<ClassGroup> {
    /*
     * `public_id` no tiene default en la base y su unicidad es global, así que
     * el candidato se genera aquí evitando los que ya existen y la base arbitra
     * la carrera: si dos tutores generan el mismo a la vez, uno recibe 23505 y
     * vuelve a intentarlo.
     */
    const taken = await supabase.from('class_group_directory').select('public_id');

    if (taken.error) {
      return {
        data: null,
        error: classroomError(taken.error, 'No se pudo crear el salón.', 'classroom_create_error'),
      };
    }

    const existing = (taken.data ?? []).map((row) => ({ publicId: row.public_id ?? '' }));

    for (let attempt = 0; attempt < PUBLIC_ID_ATTEMPTS; attempt += 1) {
      const created = await supabase
        .from('class_groups')
        .insert({
          tutor_id: tutorId,
          public_id: generatePublicId(existing),
          name: input.name.trim(),
          grade_label: input.gradeLabel.trim(),
          teacher_name: input.teacherName.trim(),
          capacity: input.capacity,
        })
        .select('*')
        .maybeSingle();

      if (!created.error && created.data) {
        return {
          data: {
            id: created.data.id,
            publicId: created.data.public_id,
            name: created.data.name,
            gradeLabel: created.data.grade_label,
            teacherName: created.data.teacher_name,
            capacity: created.data.capacity,
            memberCount: 0,
            students: [],
            pendingRequests: [],
          },
          error: null,
        };
      }

      if (created.error?.code !== UNIQUE_VIOLATION) {
        return {
          data: null,
          error: classroomError(
            created.error,
            'No se pudo crear el salón.',
            'classroom_create_error'
          ),
        };
      }
    }

    return {
      data: null,
      error: classroomError(
        null,
        'No se pudo asignar un ID único al salón. Inténtalo de nuevo.',
        'classroom_public_id_error'
      ),
    };
  },

  async deleteGroup(groupId: string): ServiceResult<null> {
    const { error } = await supabase.from('class_groups').delete().eq('id', groupId);

    if (error) {
      return {
        data: null,
        error: classroomError(error, 'No se pudo eliminar el salón.', 'classroom_delete_error'),
      };
    }

    return { data: null, error: null };
  },

  async removeStudent(groupId: string, studentId: string): ServiceResult<null> {
    const { error } = await supabase
      .from('class_memberships')
      .delete()
      .eq('group_id', groupId)
      .eq('student_id', studentId);

    if (error) {
      return {
        data: null,
        error: classroomError(error, 'No se pudo quitar al alumno.', 'membership_delete_error'),
      };
    }

    return { data: null, error: null };
  },

  /*
   * Aceptar no es un update: no hay política de inserción sobre
   * `class_memberships` y no la habrá. La RPC comprueba el cupo, la propiedad
   * del salón y «un alumno, un salón» dentro de una transacción.
   */
  async acceptRequest(requestId: string): ServiceResult<null> {
    const { error } = await supabase.rpc('accept_join_request', { input_request_id: requestId });

    if (error) {
      return {
        data: null,
        error: classroomError(
          error,
          'No se pudo aceptar la solicitud.',
          'join_request_accept_error'
        ),
      };
    }

    return { data: null, error: null };
  },

  async rejectRequest(requestId: string): ServiceResult<null> {
    const { error } = await supabase
      .from('join_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      return {
        data: null,
        error: classroomError(
          error,
          'No se pudo rechazar la solicitud.',
          'join_request_reject_error'
        ),
      };
    }

    return { data: null, error: null };
  },

  async requestJoin(groupId: string, studentId: string): ServiceResult<null> {
    const { error } = await supabase.from('join_requests').insert({
      group_id: groupId,
      // Tampoco tiene default: la política compara este campo con auth.uid().
      student_id: studentId,
    });

    if (error) {
      return {
        data: null,
        error: classroomError(
          error,
          'No se pudo enviar la solicitud.',
          'join_request_create_error'
        ),
      };
    }

    return { data: null, error: null };
  },

  /*
   * Sólo alcanza a lo pendiente, igual que la política: borrar un rechazo y
   * volver a insertar sería reescribir el historial.
   */
  async cancelJoinRequest(studentId: string): ServiceResult<null> {
    const { error } = await supabase
      .from('join_requests')
      .delete()
      .eq('student_id', studentId)
      .eq('status', 'pending');

    if (error) {
      return {
        data: null,
        error: classroomError(
          error,
          'No se pudo cancelar la solicitud.',
          'join_request_cancel_error'
        ),
      };
    }

    return { data: null, error: null };
  },

  async leaveGroup(studentId: string): ServiceResult<null> {
    const { error } = await supabase.from('class_memberships').delete().eq('student_id', studentId);

    if (error) {
      return {
        data: null,
        error: classroomError(error, 'No se pudo salir del salón.', 'membership_delete_error'),
      };
    }

    return { data: null, error: null };
  },

  /**
   * Avisa de que algo cambió en los salones de esta sesión, para que quien
   * escucha vuelva a consultar. Vive aquí y no en el store por la misma razón
   * que las lecturas: `ClassroomsProvider` no habla con Supabase, y así los
   * tests pueden disparar un evento sin red.
   *
   * **No entrega el cambio, sólo la noticia de que lo hubo.** Quien escucha
   * relee, y esa consulta sí pasa por la RLS. Es lo que hace inofensivo que un
   * `delete` llegue sin filtrar: Realtime no puede comprobar quién tenía acceso
   * a una fila que ya no existe, así que lo reparte a todos los suscriptores
   * con la clave primaria dentro y nada más.
   */
  subscribeToClassrooms(userId: string, onChange: () => void): () => void {
    /*
     * Nombre único por llamada, no `classrooms:${userId}`. En desarrollo React
     * monta dos veces bajo StrictMode, y dos canales con el mismo topic sobre el
     * mismo cliente es justo lo que `realtime-js` no admite.
     */
    const channel = supabase.channel(`classrooms:${userId}:${crypto.randomUUID()}`);

    /*
     * Las dos tablas que cuentan la historia de un salón, y todas sus
     * operaciones: la respuesta es la misma para las tres —volver a
     * consultar—, y enumerarlas sólo daría una lista que se queda corta.
     */
    for (const table of ['join_requests', 'class_memberships'] as const) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onChange();
      });
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },
};
