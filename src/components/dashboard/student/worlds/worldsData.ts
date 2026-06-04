export type DifficultyKey = 'all' | 'easy' | 'medium' | 'hard';
export type ThemeKey = 'all' | 'logic';
export type CategoryKey = 'all' | 'beginners';

export type WorldModuleCard = {
  id: string;
  title: string;
  description: string;
  difficultyLabel: 'Fácil' | 'Intermedio' | 'Difícil';
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
    description: 'Aprende a repetir acciones sin cansarte en este mágico bosque.',
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

export const getCardToneStyles = (tone: WorldModuleCard['tone']) => {
  switch (tone) {
    case 'forest':
      return {
        surface: 'bg-[linear-gradient(180deg,#2EA9A3_0%,#D6EEF1_100%)]',
        border: 'border-b-[4px] border-b-[#177B76]',
        badge: 'text-[#2A7D79]',
        progress: 'bg-[#2A7D79]',
      };
    case 'volcano':
      return {
        surface: 'bg-[linear-gradient(180deg,#FDB848_0%,#FFF3DE_100%)]',
        border: 'border-b-[4px] border-b-[#AE7406]',
        badge: 'text-[#9B6A11]',
        progress: 'bg-[#9B6A11]',
      };
    default:
      return {
        surface: 'bg-[linear-gradient(180deg,#A985EB_0%,#E9E0FB_100%)]',
        border: 'border-b-[4px] border-b-[#7B4CD7]',
        badge: 'text-[#7C59C7]',
        progress: 'bg-[#7C59C7]',
      };
  }
};
