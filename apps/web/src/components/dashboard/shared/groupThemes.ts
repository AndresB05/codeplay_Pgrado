export type GroupThemeKey = 'rocket' | 'robot' | 'dino' | 'star' | 'forest' | 'ocean';

export interface GroupTheme {
  key: GroupThemeKey;
  /** Nombre del mundo visual del salón, para lectores de pantalla. */
  label: string;
  color: string;
  colorDark: string;
  colorSoft: string;
  /** Degradado de la cabecera de la tarjeta. */
  gradient: string;
}

const GROUP_THEMES: GroupTheme[] = [
  {
    key: 'rocket',
    label: 'Cohete',
    color: '#7B3FE4',
    colorDark: '#5620B0',
    colorSoft: '#F0E6FF',
    gradient: 'linear-gradient(135deg, #A77BF3 0%, #7B3FE4 100%)',
  },
  {
    key: 'robot',
    label: 'Robot',
    color: '#3B9DF8',
    colorDark: '#1C6DC4',
    colorSoft: '#DDEEFF',
    gradient: 'linear-gradient(135deg, #7FC4FF 0%, #3B9DF8 100%)',
  },
  {
    key: 'dino',
    label: 'Dinosaurio',
    color: '#7ED957',
    colorDark: '#4A9F28',
    colorSoft: '#E6F9DD',
    gradient: 'linear-gradient(135deg, #B4EE9B 0%, #7ED957 100%)',
  },
  {
    key: 'star',
    label: 'Estrella',
    color: '#FFC93C',
    colorDark: '#D99A00',
    colorSoft: '#FFF4D6',
    gradient: 'linear-gradient(135deg, #FFE29A 0%, #FFC93C 100%)',
  },
  {
    key: 'forest',
    label: 'Bosque',
    color: '#17C3B2',
    colorDark: '#0C8577',
    colorSoft: '#D6F7F3',
    gradient: 'linear-gradient(135deg, #7CE6DA 0%, #17C3B2 100%)',
  },
  {
    key: 'ocean',
    label: 'Océano',
    color: '#FF7BC2',
    colorDark: '#CF3F92',
    colorSoft: '#FFE4F3',
    gradient: 'linear-gradient(135deg, #FFB3DC 0%, #FF7BC2 100%)',
  },
];

/**
 * Cada salón recibe siempre la misma identidad visual, derivada de su id.
 * Así dos salones seguidos no se confunden y el niño reconoce el suyo de un
 * vistazo, sin que haga falta guardar el tema en la base de datos.
 */
export const getGroupTheme = (groupId: string): GroupTheme => {
  const hash = groupId
    .split('')
    .reduce((accumulator, char) => (accumulator * 31 + char.charCodeAt(0)) % 100000, 7);

  return GROUP_THEMES[hash % GROUP_THEMES.length];
};
