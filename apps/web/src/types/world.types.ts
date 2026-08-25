import type { Database } from './database.types';

type WorldRow = Database['public']['Tables']['worlds']['Row'];
type LevelRow = Database['public']['Tables']['levels']['Row'];

export type Difficulty = LevelRow['difficulty'];

export interface World {
  accentColor: WorldRow['accent_color'];
  createdAt: WorldRow['created_at'];
  description: WorldRow['description'];
  id: WorldRow['id'];
  isPublished: WorldRow['is_published'];
  /** Identificador de la ilustración, no una URL. */
  mascot: WorldRow['mascot'];
  name: WorldRow['title'];
  orderIndex: WorldRow['sort_order'];
  regionLabel: WorldRow['region_label'];
  slug: WorldRow['slug'];
  themeColor: WorldRow['theme_color'];
}

export interface Level {
  createdAt: LevelRow['created_at'];
  description: LevelRow['description'];
  difficulty: LevelRow['difficulty'];
  id: LevelRow['id'];
  isPublished: LevelRow['is_published'];
  name: LevelRow['title'];
  orderIndex: LevelRow['sort_order'];
  slug: LevelRow['slug'];
  starsReward: LevelRow['stars_reward'];
  worldId: LevelRow['world_id'];
  xpReward: LevelRow['xp_reward'];
}

export type WorldStatus = 'locked' | 'unlocked' | 'completed';

export interface WorldWithStatus extends World {
  progress: number;
  status: WorldStatus;
}
