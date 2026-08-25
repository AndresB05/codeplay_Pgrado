import type { WorldWithStatus } from '../../../types/world.types';

export const getWorldStatusColor = (status: WorldWithStatus['status']): string => {
  switch (status) {
    case 'locked':
      return 'bg-gray-400';
    case 'unlocked':
      return 'bg-primary';
    case 'completed':
      return 'bg-green-500';
    default:
      return 'bg-gray-400';
  }
};

export const getDifficultyLabel = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  switch (difficulty) {
    case 'easy':
      return 'Fácil';
    case 'medium':
      return 'Intermedio';
    case 'hard':
      return 'Difícil';
    default:
      return 'Desconocido';
  }
};
