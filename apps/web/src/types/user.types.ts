import type { Database } from './database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/** Generado desde el enum `user_role` del esquema, nunca escrito a mano. */
export type UserRole = Database['public']['Enums']['user_role'];

export interface User {
  avatarKey: ProfileRow['avatar_key'];
  countryCode: ProfileRow['country_code'];
  createdAt: ProfileRow['created_at'];
  /** No está en `profiles`: vive en la capa de autenticación. */
  email: string | null;
  fullName: ProfileRow['full_name'];
  id: ProfileRow['id'];
  maxStreak: ProfileRow['max_streak'];
  role: UserRole;
  streakDays: ProfileRow['current_streak'];
  updatedAt: ProfileRow['updated_at'];
  username: ProfileRow['username'];
  xp: ProfileRow['total_xp'];
}

export interface UserProfileUpdate {
  avatarKey?: ProfileRow['avatar_key'];
  countryCode?: ProfileRow['country_code'];
  fullName?: ProfileRow['full_name'];
  username?: ProfileRow['username'];
}

export interface Avatar {
  category: 'animal' | 'fantasy' | 'object';
  id: string;
  imageUrl: string;
  name: string;
}
