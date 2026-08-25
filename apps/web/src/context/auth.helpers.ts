import type { Session } from '@supabase/supabase-js';
import { ROUTES } from '../constants/routes';
import type { User, UserRole } from '../types/user.types';

export const getUserRole = (user: User | null): UserRole | null => {
  return user?.role ?? null;
};

export const isAuthenticated = (session: Session | null): boolean => {
  return session !== null;
};

export const isChild = (user: User | null): boolean => {
  return getUserRole(user) === 'child';
};

export const isTutor = (user: User | null): boolean => {
  return getUserRole(user) === 'tutor';
};

/** Panel al que pertenece cada rol: el niño juega, el profesor administra salones. */
export const getHomeRouteForRole = (role: UserRole | null): string => {
  return role === 'tutor' ? ROUTES.TEACHER_GROUPS : ROUTES.WORLDS;
};
