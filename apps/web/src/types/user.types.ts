import type { Database } from './database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type UserRole = ProfileRow['role'];

export interface User {
  avatarUrl: ProfileRow['avatar_url'];
  createdAt: ProfileRow['created_at'];
  email: ProfileRow['email'];
  fullName: ProfileRow['full_name'];
  id: ProfileRow['id'];
  role: UserRole;
  streakDays: ProfileRow['streak_days'];
  updatedAt: ProfileRow['updated_at'];
  xp: ProfileRow['xp'];
}

export interface UserProfileUpdate {
  avatarUrl?: ProfileRow['avatar_url'];
  fullName?: ProfileRow['full_name'];
}

export interface Avatar {
  category: 'animal' | 'fantasy' | 'object';
  id: string;
  imageUrl: string;
  name: string;
}
