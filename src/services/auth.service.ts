import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { ROUTES } from '../constants/routes';
import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { UserRole } from '../types/user.types';

interface SignInCredentials {
  email: string;
  password: string;
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

const getOAuthRedirectUrl = (): string => {
  return new URL(ROUTES.DASHBOARD, window.location.origin).toString();
};

export const authService = {
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
};
