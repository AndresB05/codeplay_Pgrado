import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AppError } from '../errors/AppError';
import type { User, UserRole } from '../types/user.types';

export interface AuthContextValue {
  clearError: () => void;
  error: AppError | null;
  loading: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<boolean>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<boolean>;
  user: User | null;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
