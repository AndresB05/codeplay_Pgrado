import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { ROUTES } from '../constants/routes';
import { AppError } from '../errors/AppError';
import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { UserRole } from '../types/user.types';

/**
 * El correo del registro ya tiene cuenta. El aviso que se enseñe con esto SHALL
 * quedarse en genérico: aquí no hay sesión, así que quien está delante no está
 * identificado, y nombrar el rol le diría a un desconocido si detrás de ese
 * correo hay un niño o un tutor.
 */
export const ACCOUNT_ALREADY_EXISTS = 'auth_account_already_exists';

interface SignInCredentials {
  email: string;
  password: string;
}

interface ChangePasswordCredentials {
  currentPassword: string;
  email: string;
  newPassword: string;
}

interface SignUpCredentials {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
}

interface AuthSessionData {
  session: Session | null;
  user: SupabaseUser | null;
}

/*
 * Vuelve a `/auth/callback` y no a un panel: al construir esta URL todavía no se
 * sabe cuál será el rol —el perfil aún no existe—, así que cualquier ruta con
 * rol rebotaría a la mitad de la gente enseñando de paso el panel del otro.
 */
const getOAuthRedirectUrl = (): string => {
  return new URL(ROUTES.AUTH_CALLBACK, window.location.origin).toString();
};

/*
 * Se construye desde `ROUTES` y no con una cadena escrita a mano: una constante
 * suelta se desincroniza en cuanto alguien renombre la ruta, y el fallo sólo
 * aparecería dentro del correo, que es lo más caro de depurar del proyecto.
 */
const getPasswordResetRedirectUrl = (): string => {
  return new URL(ROUTES.RESET_PASSWORD, window.location.origin).toString();
};

const applyNewPassword = async (newPassword: string): ServiceResult<void> => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return {
      data: null,
      error: createAppError(
        error,
        'No se pudo cambiar la contraseña.',
        'auth_update_password_error'
      ),
    };
  }

  return { data: undefined, error: null };
};

export const authService = {
  /**
   * Verifica la contraseña actual antes de cambiarla.
   *
   * `updateUser` no la exige —la sesión abierta le basta—, pero esto se usa en
   * computadores de aula compartidos: quien se siente ante la sesión de un
   * compañero podría cambiarle la contraseña y dejarlo fuera, y la salida por
   * correo es justo la que un niño puede no controlar.
   *
   * La verificación emite una sesión nueva del MISMO usuario, que es inocuo. Un
   * fallo no toca la sesión ya almacenada, así que quien teclea mal sigue
   * dentro viendo el motivo; por eso vive aquí y no en el `signIn` del
   * contexto, que movería `loading` y `error` globales.
   */
  async changePassword(credentials: ChangePasswordCredentials): ServiceResult<void> {
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.currentPassword,
    });

    if (reauthError) {
      /*
       * Un 400 es «esa no es tu contraseña». Cualquier otra cosa —red caída,
       * servidor que no responde— no dice nada sobre la contraseña, y acusar de
       * equivocarse a quien la tecleó bien manda a buscar el fallo donde no está.
       */
      const isWrongPassword = reauthError.status === 400;

      return {
        data: null,
        error: new AppError(
          isWrongPassword
            ? 'La contraseña actual no es correcta.'
            : 'No se pudo comprobar tu contraseña actual. Inténtalo de nuevo.',
          isWrongPassword ? 'auth_wrong_current_password' : 'auth_reauth_error',
          reauthError
        ),
      };
    }

    return applyNewPassword(credentials.newPassword);
  },

  async getSession(): ServiceResult<Session | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        data: null,
        error: createAppError(
          error,
          'No se pudo recuperar la sesión actual.',
          'auth_session_error'
        ),
      };
    }

    return { data: data.session, error: null };
  },

  /**
   * Pide el correo con el enlace de recuperación. Supabase responde igual
   * exista o no la cuenta, y la interfaz mantiene esa indistinción: si el aviso
   * cambiara, la pantalla serviría para averiguar quién está dado de alta.
   */
  async requestPasswordReset(email: string): ServiceResult<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordResetRedirectUrl(),
    });

    if (error) {
      return {
        data: null,
        error: createAppError(
          error,
          'No se pudo enviar el correo de recuperación.',
          'auth_reset_request_error'
        ),
      };
    }

    return { data: undefined, error: null };
  },

  async signIn(credentials: SignInCredentials): ServiceResult<AuthSessionData> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudo iniciar sesión.', 'auth_sign_in_error'),
      };
    }

    return {
      data: {
        session: data.session,
        user: data.user,
      },
      error: null,
    };
  },

  async signInWithGoogle(): ServiceResult<{ url: string }> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getOAuthRedirectUrl(),
      },
    });

    if (error) {
      return {
        data: null,
        error: createAppError(
          error,
          'No se pudo iniciar sesión con Google.',
          'auth_google_sign_in_error'
        ),
      };
    }

    if (!data.url) {
      return {
        data: null,
        error: createAppError(
          new Error('Supabase no devolvió URL de redirección para Google OAuth.'),
          'No se pudo iniciar el flujo con Google.',
          'auth_google_redirect_missing'
        ),
      };
    }

    return { data: { url: data.url }, error: null };
  },

  async signOut(): ServiceResult<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudo cerrar la sesión.', 'auth_sign_out_error'),
      };
    }

    return { data: undefined, error: null };
  },

  async signUp(credentials: SignUpCredentials): ServiceResult<AuthSessionData> {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName,
          role: credentials.role,
        },
      },
    });

    if (error) {
      /*
       * Medido, no supuesto: con la confirmación por correo APAGADA
       * (`mailer_autoconfirm: true`), un correo ya registrado responde 422 con
       * este código. La señal que documenta Supabase —un `user` con `identities`
       * vacío— es la de cuando la confirmación está encendida, y aquí no llega.
       * Comprobado además que la cuenta existente queda intacta: la contraseña
       * de ese intento no entra y la verdadera sigue entrando.
       */
      if (error.code === 'user_already_exists') {
        return {
          data: null,
          error: new AppError(
            'Ya existe una cuenta con ese correo. Inicia sesión.',
            ACCOUNT_ALREADY_EXISTS,
            error
          ),
        };
      }

      return {
        data: null,
        error: createAppError(error, 'No se pudo crear la cuenta.', 'auth_sign_up_error'),
      };
    }

    return {
      data: {
        session: data.session,
        user: data.user,
      },
      error: null,
    };
  },

  /**
   * Fija la contraseña sin pedir la anterior. La usa la pantalla a la que lleva
   * el enlace del correo, donde quien llega es exactamente quien no la sabe.
   */
  async updatePassword(newPassword: string): ServiceResult<void> {
    return applyNewPassword(newPassword);
  },
};
