import { AppError } from '../errors/AppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';

type InvitationRow = Database['public']['Tables']['invitations']['Row'];

/** En cuál de las tres situaciones está un enlace. */
export type InvitationState = 'valid' | 'used' | 'expired';

/** Un enlace de invitación, tal y como lo ve el tutor que lo generó. */
export interface Invitation {
  id: InvitationRow['id'];
  groupId: InvitationRow['group_id'];
  token: InvitationRow['token'];
  state: InvitationState;
  sentAt: InvitationRow['sent_at'];
  expiresAt: InvitationRow['expires_at'];
  acceptedAt: InvitationRow['accepted_at'];
}

/** Lo que se sabe de un enlace antes de canjearlo, sin gastarlo. */
export interface InvitationPreview {
  groupName: string;
  groupPublicId: string;
  freeSeats: number;
  state: InvitationState;
}

export interface InvitationsService {
  createInvitation: (groupId: string, tutorId: string) => ServiceResult<Invitation>;
  listInvitations: (groupIds: string[]) => ServiceResult<Invitation[]>;
  deleteInvitation: (invitationId: string) => ServiceResult<null>;
  purgeExpired: (groupIds: string[]) => ServiceResult<null>;
  previewInvitation: (token: string) => ServiceResult<InvitationPreview>;
}

/*
 * Los motivos que levanta la base vienen en inglés y la interfaz es en español,
 * así que se traducen aquí por código, como en `classrooms.service.ts` y en
 * `missions.service.ts`.
 *
 * ES UN MAPA PROPIO Y NO EL DE SALONES, aunque tres códigos coincidan. `23514` y
 * `23505` los levanta también `accept_join_request`, pero allí los lee el TUTOR
 * —«Quita a algún explorador o amplía los cupos»— y aquí los lee el NIÑO, que no
 * puede ampliar nada. El código es el mismo; quien está delante, no.
 */
const ERROR_MESSAGES: Record<string, string> = {
  ZC010: 'Ese enlace no es válido. Pídele a tu profesor uno nuevo.',
  ZC011: 'Ese enlace ya caducó. Pídele a tu profesor uno nuevo.',
  ZC012: 'Ese enlace ya lo usó alguien. Pídele a tu profesor uno nuevo.',
  '23514': 'Ese salón ya está lleno.',
  '23505': 'Ya perteneces a un salón. Sal de él antes de entrar en otro.',
  '42501': 'No puedes entrar a un salón con esta cuenta.',
  P0002: 'Ese salón ya no existe.',
  '42P17': 'El servidor no pudo comprobar los permisos. Avisa a quien mantiene la plataforma.',
};

const readErrorCode = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code?: unknown };

    return typeof code === 'string' ? code : undefined;
  }

  return undefined;
};

export const invitationError = (
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

const isExpired = (row: InvitationRow): boolean => {
  return row.status === 'expired' || Date.parse(row.expires_at) <= Date.now();
};

/**
 * El estado sale de DOS datos, `status` y `expires_at`, y nunca de uno solo.
 *
 * El panel anterior pintaba `status === 'pending' ? 'Pendiente' : 'Aceptada'`, y
 * con eso un enlace caducado se habría enseñado como «Aceptada»: le diría al
 * tutor que puede compartir algo que no va a funcionar. Estaba dormido porque
 * nada escribía filas; desde este cambio, sí.
 *
 * `status` admite `expired` desde la 0013 pero nada lo escribe, así que la
 * caducidad la decide la fecha. Se mira igualmente la columna para que el día
 * que algo la marque no haya dos verdades.
 */
const readState = (row: InvitationRow): InvitationState => {
  if (row.status === 'accepted') {
    return 'used';
  }

  return isExpired(row) ? 'expired' : 'valid';
};

const mapInvitationRow = (row: InvitationRow): Invitation => ({
  id: row.id,
  groupId: row.group_id,
  token: row.token,
  state: readState(row),
  sentAt: row.sent_at,
  expiresAt: row.expires_at,
  acceptedAt: row.accepted_at,
});

export const invitationsService: InvitationsService = {
  /*
   * Escritura por RLS y no por RPC, al revés que el canje: la política de la
   * 0013 ya comprueba lo único que hay que comprobar —que el salón es del
   * tutor—, y `token` y `expires_at` los pone la base por defecto.
   *
   * `invited_by` se manda EXPLÍCITO. No tiene `default auth.uid()`, igual que
   * `join_requests.student_id` y `class_memberships.student_id`, y omitirlo
   * responde `42501`, que se diagnostica mal: parece un problema de permisos y
   * es una columna sin valor.
   */
  async createInvitation(groupId: string, tutorId: string): ServiceResult<Invitation> {
    const { data, error } = await supabase
      .from('invitations')
      .insert({ group_id: groupId, invited_by: tutorId })
      .select('*')
      .maybeSingle();

    if (error || !data) {
      return {
        data: null,
        error: invitationError(
          error,
          'No se pudo generar el enlace de invitación.',
          'invitation_create_error'
        ),
      };
    }

    return { data: mapInvitationRow(data), error: null };
  },

  async listInvitations(groupIds: string[]): ServiceResult<Invitation[]> {
    if (groupIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .in('group_id', groupIds)
      .order('sent_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: invitationError(
          error,
          'No se pudieron cargar los enlaces de invitación.',
          'invitations_get_error'
        ),
      };
    }

    return { data: (data ?? []).map(mapInvitationRow), error: null };
  },

  async deleteInvitation(invitationId: string): ServiceResult<null> {
    const { error } = await supabase.from('invitations').delete().eq('id', invitationId);

    if (error) {
      return {
        data: null,
        error: invitationError(error, 'No se pudo retirar el enlace.', 'invitation_delete_error'),
      };
    }

    return { data: null, error: null };
  },

  /**
   * La purga del plazo de conservación, con la política de borrado que ya existe
   * desde la 0013: no hace falta función ni permiso nuevo.
   *
   * Filtra por `expires_at` y NUNCA por `status`, porque nada escribe `expired`
   * en esa columna. Y no es lo que impide canjear un enlace vencido —eso lo
   * comprueba la RPC—, sino lo que evita que la lista del tutor crezca con filas
   * que ya no sirven.
   *
   * SE LLEVA TAMBIÉN LAS YA USADAS que hayan pasado de fecha. El plazo de
   * conservación dice que estas filas viven 14 días, no que vivan 14 días si
   * nadie las canjeó: excluir las aceptadas las dejaría para siempre. El tutor
   * ve «usado» durante esos 14 días, que es cuando le sirve saberlo.
   */
  async purgeExpired(groupIds: string[]): ServiceResult<null> {
    if (groupIds.length === 0) {
      return { data: null, error: null };
    }

    const { error } = await supabase
      .from('invitations')
      .delete()
      .in('group_id', groupIds)
      .lte('expires_at', new Date().toISOString());

    if (error) {
      return {
        data: null,
        error: invitationError(
          error,
          'No se pudieron limpiar los enlaces caducados.',
          'invitations_purge_error'
        ),
      };
    }

    return { data: null, error: null };
  },

  /**
   * Mirar sin gastar. Devuelve un array porque la función es `returns table`,
   * así que la fila única se saca aquí y no la sufre quien llama.
   */
  async previewInvitation(token: string): ServiceResult<InvitationPreview> {
    const { data, error } = await supabase.rpc('preview_invitation', { input_token: token });

    if (error) {
      return {
        data: null,
        error: invitationError(error, 'No se pudo leer la invitación.', 'invitation_preview_error'),
      };
    }

    const preview = data?.[0];

    if (!preview) {
      return {
        data: null,
        error: invitationError(null, 'Ese enlace no es válido.', 'ZC010'),
      };
    }

    return {
      data: {
        groupName: preview.group_name,
        groupPublicId: preview.group_public_id,
        freeSeats: preview.free_seats,
        /*
         * `state` llega como `string` porque la función lo construye con un
         * `case`, no con un enum. Se acota aquí para que la pantalla no tenga
         * que defenderse de un valor que no conoce.
         */
        state: preview.state === 'used' || preview.state === 'expired' ? preview.state : 'valid',
      },
      error: null,
    };
  },
};
