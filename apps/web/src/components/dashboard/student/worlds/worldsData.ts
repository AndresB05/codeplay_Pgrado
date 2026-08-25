export type DifficultyKey = 'all' | 'easy' | 'medium' | 'hard';
export type ThemeKey = 'all' | 'logic';
export type CategoryKey = 'all' | 'beginners';
export type DifficultyLabel = 'Fácil' | 'Intermedio' | 'Difícil';

export type WorldModuleCard = {
  id: string;
  title: string;
  description: string;
  difficultyLabel: DifficultyLabel;
  difficulty: Exclude<DifficultyKey, 'all'>;
  theme: ThemeKey;
  category: CategoryKey;
  tone: 'forest' | 'volcano' | 'ocean';
  completedLevels: number;
  totalLevels: number;
};

export const studentWorlds: WorldModuleCard[] = [
  {
    id: 'forest-loops',
    title: 'Bosque de Bucles',
    description: 'Aprende a repetir acciones sin cansarte en esta selva mágica.',
    difficultyLabel: 'Fácil',
    difficulty: 'easy',
    theme: 'logic',
    category: 'beginners',
    tone: 'forest',
    completedLevels: 4,
    totalLevels: 10,
  },
  {
    id: 'volcano-variables',
    title: 'Volcán de Variables',
    description: 'Guarda información importante antes de que haga erupción.',
    difficultyLabel: 'Intermedio',
    difficulty: 'medium',
    theme: 'logic',
    category: 'beginners',
    tone: 'volcano',
    completedLevels: 2,
    totalLevels: 10,
  },
  {
    id: 'ocean-objects',
    title: 'Océano de Objetos',
    description: 'Sumérgete en las profundidades de la programación orientada a objetos.',
    difficultyLabel: 'Difícil',
    difficulty: 'hard',
    theme: 'logic',
    category: 'beginners',
    tone: 'ocean',
    completedLevels: 1,
    totalLevels: 10,
  },
];

export interface WorldToneStyles {
  /** Degradado de la cabecera de la tarjeta (135°, claro → saturado). */
  gradient: string;
  /** Color sólido del bioma: barras de progreso e insignias. */
  color: string;
  /** Clase de etiqueta del sistema (`.chip-*`) que acompaña al bioma. */
  chip: string;
  /** Fondo suave para cajas internas. */
  soft: string;
  /** Texto sobre el fondo suave. */
  text: string;
}

/**
 * Cada bioma reutiliza un color de la paleta viva, igual que los temas de
 * salón: selva en verde, volcán en sol y océano en cielo.
 */
export const getCardToneStyles = (tone: WorldModuleCard['tone']): WorldToneStyles => {
  switch (tone) {
    case 'forest':
      return {
        gradient: 'linear-gradient(135deg, #4ECB85 0%, #1F9D5B 100%)',
        color: '#1F9D5B',
        chip: 'chip-leaf',
        soft: 'bg-jungle-soft',
        text: 'text-jungle-dark',
      };
    case 'volcano':
      return {
        gradient: 'linear-gradient(135deg, #FFC93C 0%, #FF8A3D 100%)',
        color: '#FF8A3D',
        chip: 'chip-papaya',
        soft: 'bg-papaya-soft',
        text: 'text-papaya-dark',
      };
    default:
      return {
        gradient: 'linear-gradient(135deg, #7FC4FF 0%, #3B9DF8 100%)',
        color: '#3B9DF8',
        chip: 'chip-sky',
        soft: 'bg-sky-soft',
        text: 'text-sky-dark',
      };
  }
};
