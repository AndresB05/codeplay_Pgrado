import { AppError } from '../errors/AppError';
import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type { User, UserProfileUpdate, UserRole } from '../types/user.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * Distingue «la fila no existe» de cualquier otro fallo al cargar el perfil.
 * Quien reciba este código puede cerrar la sesión; con los demás no debe, que
 * un corte de red no dice nada sobre si la cuenta tiene perfil.
 */
export const PROFILE_NOT_FOUND = 'profile_not_found';

/**
 * El rol del perfil no se puede cambiar: o ya se declaró al darse de alta, o la
 * cuenta tiene lazos de salón. Quien reciba este código NO debe presentarlo como
 * un fallo: la sesión es válida y el rol simplemente se queda como estaba.
 */
export const PROFILE_ROLE_LOCKED = 'profile_role_locked';

/**
 * Los dos rechazos que levanta `set_my_role`. La clase `ZC` cae en el tramo I-Z
 * que el estándar deja a la implementación y no choca con las de PostgreSQL
 * (`P0` y `XX`).
 */
const ROLE_LOCKED_SQLSTATES = {
  alreadyDeclared: 'ZC001',
  classroomTies: 'ZC002',
} as const;

/**
 * El correo no está en `profiles`: vive en la capa de autenticación, así que
 * quien lo tenga a mano lo pasa aparte.
 */
const mapProfileRowToUser = (profile: ProfileRow, email: string | null = null): User => {
  return {
    avatarKey: profile.avatar_key,
    countryCode: profile.country_code,
    createdAt: profile.created_at,
    email,
    fullName: profile.full_name,
    id: profile.id,
    maxStreak: profile.max_streak,
    role: profile.role,
    streakDays: profile.current_streak,
    updatedAt: profile.updated_at,
    username: profile.username,
    xp: profile.total_xp,
  };
};

export const profileService = {
  async getProfile(userId: string, email: string | null = null): ServiceResult<User> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudo cargar el perfil.', 'profile_get_error'),
      };
    }

    /*
     * `maybeSingle()` sólo devuelve `null` sin error cuando la consulta terminó
     * bien y la fila no existe, así que aquí no hay ambigüedad con un fallo de
     * red. Devolver un vacío obligaba a cada consumidor a inventar qué
     * significaba, y el de la sesión lo interpretaba como «sin rol», que es
     * como un tutor sin perfil acababa viendo el panel del niño.
     */
    if (!data) {
      return {
        data: null,
        error: new AppError(
          'Esta cuenta no tiene perfil. Avisa a quien mantiene la plataforma.',
          PROFILE_NOT_FOUND
        ),
      };
    }

    return { data: mapProfileRowToUser(data, email), error: null };
  },

  /**
   * Fija el rol del perfil después del alta, que es lo único que sirve cuando el
   * alta no pudo declararlo: un acceso con Google no lleva metadatos, así que la
   * cuenta nace `child` aunque quien se registró hubiera elegido «Tutor».
   *
   * `update_my_profile` no vale porque deja el rol fuera a propósito, y un
   * `update` directo tampoco: la 0009 revoca la escritura sobre `profiles`.
   */
  async setMyRole(role: UserRole, email: string | null = null): ServiceResult<User> {
    const { data, error } = await supabase.rpc('set_my_role', { input_role: role }).single();

    if (error) {
      /*
       * El servidor manda dos rechazos distintos —el rol ya declarado y los
       * lazos de salón— y aquí se traducen al MISMO código, a propósito: para
       * quien está delante los dos significan «tu rol se queda como está» y
       * merecen el mismo aviso. La distinción se conserva abajo, en el SQLSTATE,
       * porque diagnosticar sí los separa.
       */
      if (error.code === ROLE_LOCKED_SQLSTATES.alreadyDeclared || error.code === ROLE_LOCKED_SQLSTATES.classroomTies) {
        return {
          data: null,
          error: new AppError(
            'Esta cuenta ya existía, así que su tipo no cambia.',
            PROFILE_ROLE_LOCKED,
            error
          ),
        };
      }

      return {
        data: null,
        error: createAppError(error, 'No se pudo asignar tu tipo de cuenta.', 'profile_set_role_error'),
      };
    }

    return { data: mapProfileRowToUser(data, email), error: null };
  },

  /**
   * Pasa por la función RPC y no por un `update` sobre la tabla: la migración
   * que activa RLS revoca la escritura directa sobre `profiles` al rol
   * `authenticated`, de modo que `update_my_profile` es la única vía.
   */
  async updateProfile(
    updates: UserProfileUpdate,
    email: string | null = null
  ): ServiceResult<User> {
    const { data, error } = await supabase
      .rpc('update_my_profile', {
        input_username: updates.username ?? undefined,
        input_full_name: updates.fullName ?? undefined,
        input_avatar_key: updates.avatarKey ?? undefined,
        input_country_code: updates.countryCode ?? undefined,
      })
      .single();

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudo actualizar el perfil.', 'profile_update_error'),
      };
    }

    return { data: mapProfileRowToUser(data, email), error: null };
  },
};
