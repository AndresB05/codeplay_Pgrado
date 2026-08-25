import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';

type AchievementRow = Database['public']['Tables']['achievements']['Row'];

/**
 * Un logro **ya concedido**. La tabla `achievements` es el registro por usuario
 * de lo obtenido, con `unique (user_id, achievement_key)`; no es un catálogo de
 * definiciones.
 *
 * Por eso aquí no hay progreso ni logros pendientes: el catálogo con sus
 * condiciones de desbloqueo no existe en el esquema y diseñarlo es el paso 22
 * del roadmap. Hasta entonces, esta sala sólo puede listar lo conseguido.
 */
export interface UnlockedAchievement {
  id: AchievementRow['id'];
  key: AchievementRow['achievement_key'];
  title: AchievementRow['title'];
  description: AchievementRow['description'];
  iconName: AchievementRow['icon_name'];
  awardedXp: AchievementRow['awarded_xp'];
  unlockedAt: AchievementRow['unlocked_at'];
}

const mapAchievementRow = (achievement: AchievementRow): UnlockedAchievement => {
  return {
    id: achievement.id,
    key: achievement.achievement_key,
    title: achievement.title,
    description: achievement.description,
    iconName: achievement.icon_name,
    awardedXp: achievement.awarded_xp,
    unlockedAt: achievement.unlocked_at,
  };
};

export const achievementsService = {
  async getUnlockedAchievements(userId: string): ServiceResult<UnlockedAchievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudieron cargar los logros.', 'achievements_get_error'),
      };
    }

    return { data: data.map(mapAchievementRow), error: null };
  },
};
