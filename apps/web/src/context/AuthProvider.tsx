import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import { authService } from '../services/auth.service';
import { profileService } from '../services/profile.service';
import type { AppError } from '../errors/AppError';
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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const syncSessionProfile = useCallback(async (nextSession: Session | null): Promise<void> => {
    setSession(nextSession);

    if (!nextSession?.user) {
      setUser(null);
      return;
    }

    const profileResult = await profileService.getProfile(nextSession.user.id);

    if (profileResult.error) {
      setUser(null);
      setError(profileResult.error);
      return;
    }

    setUser(profileResult.data);
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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

      await syncSessionProfile(result.data?.session ?? null);
      setLoading(false);
      return true;
    },
    [syncSessionProfile]
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, role: UserRole): Promise<boolean> => {
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
        return false;
      }

      await syncSessionProfile(result.data?.session ?? null);
      setLoading(false);
      return true;
    },
    [syncSessionProfile]
  );

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
      clearError,
      error,
      loading,
      session,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      user,
    }),
    [clearError, error, loading, session, signIn, signInWithGoogle, signOut, signUp, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
