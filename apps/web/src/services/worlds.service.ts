import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type { Level, World } from '../types/world.types';

type WorldRow = Database['public']['Tables']['worlds']['Row'];
type LevelRow = Database['public']['Tables']['levels']['Row'];

const mapWorldRow = (world: WorldRow): World => {
  return {
    color: world.color,
    createdAt: world.created_at,
    description: world.description,
    icon: world.icon,
    id: world.id,
    name: world.name,
    orderIndex: world.order_index,
  };
};

const mapLevelRow = (level: LevelRow): Level => {
  return {
    createdAt: level.created_at,
    description: level.description,
    difficulty: level.difficulty,
    id: level.id,
    name: level.name,
    orderIndex: level.order_index,
    worldId: level.world_id,
    xpReward: level.xp_reward,
  };
};

export const worldsService = {
  async getLevelsByWorld(worldId: string): ServiceResult<Level[]> {
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .eq('world_id', worldId)
      .order('order_index');

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudieron cargar los niveles.', 'levels_get_error'),
      };
    }

    return { data: data.map(mapLevelRow), error: null };
  },

  async getWorlds(): ServiceResult<World[]> {
    const { data, error } = await supabase.from('worlds').select('*').order('order_index');

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudieron cargar los mundos.', 'worlds_get_error'),
      };
    }

    return { data: data.map(mapWorldRow), error: null };
  },
};
