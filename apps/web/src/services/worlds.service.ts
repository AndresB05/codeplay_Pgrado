import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type { Level, World } from '../types/world.types';

type WorldRow = Database['public']['Tables']['worlds']['Row'];
type LevelRow = Database['public']['Tables']['levels']['Row'];

const mapWorldRow = (world: WorldRow): World => {
  return {
    accentColor: world.accent_color,
    createdAt: world.created_at,
    description: world.description,
    id: world.id,
    isPublished: world.is_published,
    mascot: world.mascot,
    name: world.title,
    orderIndex: world.sort_order,
    regionLabel: world.region_label,
    slug: world.slug,
    themeColor: world.theme_color,
  };
};

/*
 * Las tres últimas son las columnas reinterpretadas del paso 23.1: el esquema se
 * diseñó para un editor de código, y con bloques significan otra cosa —el puzle,
 * su disposición inicial y la versión del formato—. Aquí se renombran y **no se
 * interpretan**: `config` viaja como JSON sin tipo hasta la frontera, que es
 * quien lo comprueba (`game/levelConfig.ts`).
 */
const mapLevelRow = (level: LevelRow): Level => {
  return {
    config: level.validation_rules,
    createdAt: level.created_at,
    description: level.description,
    difficulty: level.difficulty,
    formatVersion: level.programming_language,
    id: level.id,
    isPublished: level.is_published,
    name: level.title,
    narrative: level.narrative,
    orderIndex: level.sort_order,
    slug: level.slug,
    starsReward: level.stars_reward,
    starterCode: level.starter_code,
    worldId: level.world_id,
    xpReward: level.xp_reward,
  };
};

export const worldsService = {
  /*
   * Un nivel por su identificador, que es lo que la pantalla de nivel tiene: la
   * dirección trae el id. Traerse la lista del mundo para quedarse con uno
   * obligaría a cargar el mundo entero para jugar uno solo, y ataría esa
   * pantalla a haber pasado antes por la lista.
   */
  async getLevelById(levelId: string): ServiceResult<Level> {
    const { data, error } = await supabase.from('levels').select('*').eq('id', levelId).single();

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudo cargar el nivel.', 'level_get_error'),
      };
    }

    return { data: mapLevelRow(data), error: null };
  },

  async getLevelsByWorld(worldId: string): ServiceResult<Level[]> {
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .eq('world_id', worldId)
      .order('sort_order');

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudieron cargar los niveles.', 'levels_get_error'),
      };
    }

    return { data: data.map(mapLevelRow), error: null };
  },

  async getWorlds(): ServiceResult<World[]> {
    const { data, error } = await supabase.from('worlds').select('*').order('sort_order');

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudieron cargar los mundos.', 'worlds_get_error'),
      };
    }

    return { data: data.map(mapWorldRow), error: null };
  },
};
