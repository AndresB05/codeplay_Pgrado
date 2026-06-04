import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';

type AchievementRow = Database['public']['Tables']['achievements']['Row'];

export interface AchievementWithProgress {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
}

export const achievementsService = {
  async getAchievementsForUser(userId: string): ServiceResult<AchievementWithProgress[]> {
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*');

    if (achievementsError) {
      return {
        data: null,
        error: createAppError(
          achievementsError,
          'No se pudieron cargar los logros.',
          'achievements_get_error'
        ),
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('streak_days,xp')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return {
        data: null,
        error: createAppError(profileError, 'No se pudo cargar el perfil del usuario.', 'profile_get_error'),
      };
    }

    const { data: completedRows, error: completedError, count } = await supabase
      .from('user_progress')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('completed', true);

    if (completedError) {
      return {
        data: null,
        error: createAppError(
          completedError,
          'No se pudo consultar el progreso completado del usuario.',
          'progress_count_error'
        ),
      };
    }

    const completedCount = typeof count === 'number' ? count : (completedRows ?? []).length;

    const mapped: AchievementWithProgress[] = (achievements ?? []).map((a: AchievementRow) => {
      const target = a.requirement_value;
      let progress: number | undefined = undefined;
      let unlocked = false;

      switch (a.requirement_type) {
        case 'levels_completed': {
          progress = completedCount;
          unlocked = (progress ?? 0) >= target;
          break;
        }

        case 'streak_days': {
          progress = profile?.streak_days ?? 0;
          unlocked = (progress ?? 0) >= target;
          break;
        }

        case 'xp_earned': {
          progress = profile?.xp ?? 0;
          unlocked = (progress ?? 0) >= target;
          break;
        }

        default: {
          progress = undefined;
          unlocked = false;
        }
      }

      return {
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        unlocked,
        progress,
        target,
      };
    });

    return { data: mapped, error: null };
  },
};
