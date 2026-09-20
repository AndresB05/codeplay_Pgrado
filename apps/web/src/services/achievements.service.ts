import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';

type AchievementRow = Database['public']['Tables']['achievements']['Row'];
type CatalogRow = Database['public']['Tables']['achievement_catalog']['Row'];

/**
 * Un logro **ya concedido**. La tabla `achievements` es el registro por usuario
 * de lo obtenido, con `unique (user_id, achievement_key)`.
 *
 * Su título y su descripción son los que TENÍA AL CONCEDERSE, copiados del
 * catálogo: renombrar un logro no reescribe lo que el niño ya ganó, y por eso
 * la sala pinta éstos y no los del catálogo cuando existen los dos.
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

/**
 * Un logro del catálogo, conseguido o no. Es lo que la Sala de Trofeos necesita
 * para enseñar también **lo que falta**, que es la mitad de para qué existe.
 */
export interface CatalogAchievement {
  key: CatalogRow['achievement_key'];
  title: CatalogRow['title'];
  description: CatalogRow['description'];
  iconName: CatalogRow['icon_name'];
  awardedXp: CatalogRow['awarded_xp'];
  /** `level`, `world`, `mastery`, `action` o `streak`. */
  category: CatalogRow['category'];
  sortOrder: CatalogRow['sort_order'];
  /** Cuándo se consiguió, o `null` si todavía no. */
  unlockedAt: string | null;
}

const mapCatalogRow = (row: CatalogRow, unlockedAt: string | null): CatalogAchievement => ({
  key: row.achievement_key,
  title: row.title,
  description: row.description,
  iconName: row.icon_name,
  awardedXp: row.awarded_xp,
  category: row.category,
  sortOrder: row.sort_order,
  unlockedAt,
});

export const achievementsService = {
  /**
   * El catálogo entero con lo conseguido encima.
   *
   * Son DOS lecturas y no un `join`: el catálogo lo puede leer cualquiera con
   * sesión y los logros sólo los suyos, así que pedirlos juntos pondría a
   * PostgREST a cruzar dos alcances distintos para ahorrar una consulta sobre
   * veinte filas.
   *
   * El título que gana es el DEL LOGRO CONSEGUIDO cuando lo hay: es el que el
   * niño vio al ganarlo, y cambiarlo por el del catálogo reescribiría su
   * pasado.
   */
  async getCatalogWithProgress(userId: string): ServiceResult<CatalogAchievement[]> {
    const [catalog, unlocked] = await Promise.all([
      supabase.from('achievement_catalog').select('*').order('sort_order'),
      supabase
        .from('achievements')
        .select('achievement_key, title, description, icon_name, unlocked_at')
        .eq('user_id', userId),
    ]);

    const readError = catalog.error ?? unlocked.error;

    if (readError) {
      return {
        data: null,
        error: createAppError(
          readError,
          'No se pudieron cargar los logros.',
          'achievements_get_error'
        ),
      };
    }

    const mine = new Map((unlocked.data ?? []).map((row) => [row.achievement_key, row]));

    return {
      data: (catalog.data ?? []).map((row) => {
        const won = mine.get(row.achievement_key);

        return mapCatalogRow(
          won ? { ...row, title: won.title, description: won.description, icon_name: won.icon_name } : row,
          won?.unlocked_at ?? null
        );
      }),
      error: null,
    };
  },

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
