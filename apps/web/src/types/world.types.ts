import type { Database } from './database.types';

type WorldRow = Database['public']['Tables']['worlds']['Row'];
type LevelRow = Database['public']['Tables']['levels']['Row'];

export type Difficulty = LevelRow['difficulty'];

export interface World {
  color: WorldRow['color'];
  createdAt: WorldRow['created_at'];
  description: WorldRow['description'];
  icon: WorldRow['icon'];
  id: WorldRow['id'];
  name: WorldRow['name'];
  orderIndex: WorldRow['order_index'];
}

export interface Level {
  createdAt: LevelRow['created_at'];
  description: LevelRow['description'];
  difficulty: LevelRow['difficulty'];
  id: LevelRow['id'];
  name: LevelRow['name'];
  orderIndex: LevelRow['order_index'];
  worldId: LevelRow['world_id'];
  xpReward: LevelRow['xp_reward'];
}

export type WorldStatus = 'locked' | 'unlocked' | 'completed';

export interface WorldWithStatus extends World {
  progress: number;
  status: WorldStatus;
}
