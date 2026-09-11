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
  /**
   * La definición del puzle, tal y como viene: JSON sin tipo. Comprobarlo es de
   * `game/levelConfig.ts`, en la frontera, no de este tipo.
   */
  config: LevelRow['validation_rules'];
  createdAt: LevelRow['created_at'];
  description: LevelRow['description'];
  difficulty: LevelRow['difficulty'];
  /** La versión del formato de `config` y del sobre. Ver el contrato §4.3. */
  formatVersion: LevelRow['programming_language'];
  id: LevelRow['id'];
  isPublished: LevelRow['is_published'];
  name: LevelRow['title'];
  /** Lo que se le dice al niño que tiene que hacer. */
  narrative: LevelRow['narrative'];
  orderIndex: LevelRow['sort_order'];
  slug: LevelRow['slug'];
  starsReward: LevelRow['stars_reward'];
  /** El sobre con la disposición inicial de bloques, sin abrir. */
  starterCode: LevelRow['starter_code'];
  worldId: LevelRow['world_id'];
  xpReward: LevelRow['xp_reward'];
}

export type WorldStatus = 'locked' | 'unlocked' | 'completed';

export interface WorldWithStatus extends World {
  progress: number;
  status: WorldStatus;
}
