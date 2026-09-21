export type DifficultyLabel = 'Fácil' | 'Intermedio' | 'Difícil';

export type WorldModuleCard = {
  id: string;
  title: string;
  description: string;
  difficultyLabel: DifficultyLabel;
  /** El pilar del pensamiento computacional que trabaja: `worlds.region_label`. */
  theme: string | null;
  tone: 'forest' | 'volcano' | 'ocean';
  /** Ilustración de la cabecera; sin ella, la tarjeta pinta su degradado e icono. */
  image: { src: string; position: string } | null;
  completedLevels: number;
  totalLevels: number;
};

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
