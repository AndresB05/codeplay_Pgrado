import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthContext } from './AuthContext';
import type { AuthContextValue, SignUpOutcome } from './AuthContext';
import { authService } from '../services/auth.service';
import { PROFILE_NOT_FOUND, profileService } from '../services/profile.service';
import { AppError } from '../errors/AppError';
import type { User, UserRole } from '../types/user.types';
import { supabase } from '../lib/supabase';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  /*
   * Quién está dentro ahora mismo, para decidir si un evento de sesión merece
   * blanquear la pantalla. Va en una referencia y no en estado porque sólo se
   * consulta dentro del subscriptor: no tiene que provocar ningún render.
   */
  const currentUserIdRef = useRef<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /** Devuelve si quedó un perfil cargado, que es lo único que habilita un panel. */
  const syncSessionProfile = useCallback(async (nextSession: Session | null): Promise<boolean> => {
    currentUserIdRef.current = nextSession?.user.id ?? null;
    setSession(nextSession);

    if (!nextSession?.user) {
      setUser(null);
      return false;
    }

    // El correo no está en `profiles`: vive en la sesión, que es su sitio.
    const profileResult = await profileService.getProfile(
      nextSession.user.id,
      nextSession.user.email ?? null
    );

    if (profileResult.error) {
      setUser(null);
      setError(profileResult.error);

      /*
       * Sólo la ausencia de perfil cierra la sesión, porque esa sesión no puede
       * hacer nada: sin perfil no hay rol, ninguna ruta con rol la admite y las
       * políticas de RLS cuelgan del perfil. Dejarla viva creaba el estado
       * «autenticado pero sin sitio a donde ir», que es como un tutor sin perfil
       * acababa viendo el panel del niño.
       *
       * Cualquier otro fallo la respeta: un corte de red no dice nada sobre si
       * la cuenta tiene perfil, y cerrarla echaría a un usuario legítimo. Se
       * llama al servicio y no al `signOut` de aquí abajo, que empieza borrando
       * el error que se acaba de guardar.
       */
      if (profileResult.error.code === PROFILE_NOT_FOUND) {
        await authService.signOut();
      }

      return false;
    }

    setUser(profileResult.data);

    return profileResult.data !== null;
  }, []);

  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      setLoading(true);

      const sessionResult = await authService.getSession();

      if (sessionResult.error) {
        setError(sessionResult.error);
        setLoading(false);
        return;
      }

      await syncSessionProfile(sessionResult.data);
      setLoading(false);
    };

    void initializeAuth();

    /*
     * Sólo un cambio de IDENTIDAD blanquea la pantalla. Las dos guardas de ruta
     * responden a `loading` cambiando todo su subárbol por un spinner, y este
     * subscriptor dispara también en cada refresco de token: sin esta condición
     * la aplicación entera parpadeaba cada vez que Supabase renovaba el token, y
     * desmontaba de paso cualquier formulario a medias. No se veía porque hasta
     * ahora ningún evento caía en mitad de una interacción.
     *
     * Se compara el id del usuario y NO el tipo de evento: por identidad, este
     * provider sigue sin leer `_event` y sin acoplarse al vocabulario de eventos
     * de Supabase.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUserId = nextSession?.user.id ?? null;
      const identityChanged = nextUserId !== currentUserIdRef.current;

      if (!identityChanged) {
        void syncSessionProfile(nextSession);
        return;
      }

      setLoading(true);
      void syncSessionProfile(nextSession).finally(() => {
        setLoading(false);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncSessionProfile]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      const result = await authService.signIn({ email, password });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return false;
      }

      const synced = await syncSessionProfile(result.data?.session ?? null);
      setLoading(false);
      return synced;
    },
    [syncSessionProfile]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      role: UserRole
    ): Promise<SignUpOutcome> => {
      setLoading(true);
      setError(null);

      const result = await authService.signUp({
        email,
        fullName,
        password,
        role,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return 'error';
      }

      /*
       * Sin sesión la cuenta se creó, pero hace falta confirmar el correo. Darlo
       * por bueno y navegar al panel es lo que dejaba al usuario en `/login`: la
       * guarda lo devolvía por no haber sesión y el registro parecía haber
       * fallado cuando en realidad estaba hecho.
       */
      if (!result.data?.session) {
        setLoading(false);
        return 'confirmation-required';
      }

      const synced = await syncSessionProfile(result.data.session);
      setLoading(false);

      return synced ? 'signed-in' : 'error';
    },
    [syncSessionProfile]
  );

  /*
   * Las tres acciones de contraseña NO tocan `loading`, a diferencia de las de
   * sesión. Ese indicador significa «la sesión se está resolviendo», y las dos
   * guardas de ruta responden a él cambiando la pantalla entera por un spinner.
   * Una contraseña se cambia DENTRO de una sesión ya resuelta, desde una
   * pantalla que vive tras esas guardas: encenderlo desmonta el formulario a
   * mitad de operación y se lleva por delante el mensaje que había que enseñar.
   * Quien llama lleva su propio indicador de envío.
   */

  /*
   * El correo sale de la sesión, no de un campo: quien cambia su contraseña es
   * quien está dentro, y pedirle que escriba su propio correo sólo añadiría una
   * forma de equivocarse.
   */
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      const email = session?.user.email;

      if (!email) {
        setError(
          new AppError(
            'No se pudo identificar tu cuenta. Vuelve a iniciar sesión.',
            'auth_missing_session_email'
          )
        );
        return false;
      }

      setError(null);

      const result = await authService.changePassword({ currentPassword, email, newPassword });

      if (result.error) {
        setError(result.error);
        return false;
      }

      return true;
    },
    [session]
  );

  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    setError(null);

    const result = await authService.requestPasswordReset(email);

    if (result.error) {
      setError(result.error);
      return false;
    }

    return true;
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<boolean> => {
    setError(null);

    const result = await authService.updatePassword(newPassword);

    if (result.error) {
      setError(result.error);
      return false;
    }

    return true;
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const result = await authService.signInWithGoogle();

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return false;
    }

    if (result.data?.url) {
      window.location.assign(result.data.url);
      return true;
    }

    setLoading(false);
    return false;
  }, []);

  const signOut = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const result = await authService.signOut();

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return false;
    }

    await syncSessionProfile(null);
    setLoading(false);
    return true;
  }, [syncSessionProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      changePassword,
      clearError,
      error,
      loading,
      requestPasswordReset,
      session,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      updatePassword,
      user,
    }),
    [
      changePassword,
      clearError,
      error,
      loading,
      requestPasswordReset,
      session,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      updatePassword,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
