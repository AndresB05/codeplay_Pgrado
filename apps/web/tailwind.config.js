/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'Segoe UI', 'sans-serif'],
        display: ['Fredoka', 'Quicksand', 'sans-serif'],
        // Letra de mano de las misiones: parece escrita sobre el mapa y se lee bien.
        map: ['"Patrick Hand"', 'Quicksand', 'sans-serif'],
      },
      colors: {
        grape: {
          DEFAULT: '#7B3FE4',
          dark: '#5620B0',
          light: '#A77BF3',
          soft: '#F0E6FF',
        },
        sun: {
          DEFAULT: '#FFC93C',
          dark: '#D99A00',
          soft: '#FFF4D6',
        },
        coral: {
          DEFAULT: '#FF5A5A',
          dark: '#C72C2C',
          soft: '#FFE6E6',
        },
        mint: {
          DEFAULT: '#17C3B2',
          dark: '#0C8577',
          soft: '#D6F7F3',
        },
        sky: {
          DEFAULT: '#3B9DF8',
          dark: '#1C6DC4',
          soft: '#DDEEFF',
        },
        lime: {
          DEFAULT: '#7ED957',
          dark: '#4A9F28',
          soft: '#E6F9DD',
        },
        bubble: {
          DEFAULT: '#FF7BC2',
          dark: '#CF3F92',
          soft: '#FFE4F3',
        },
        jungle: {
          DEFAULT: '#1F9D5B',
          dark: '#12703D',
          light: '#4ECB85',
          soft: '#DDF7E7',
        },
        papaya: {
          DEFAULT: '#FF8A3D',
          dark: '#D15B12',
          soft: '#FFE8D6',
        },
        ink: {
          DEFAULT: '#2A1B45',
          soft: '#5A5170',
          faint: '#8B82A6',
        },
        cream: '#FFF9EF',
        lavender: '#F4EEFF',
        line: '#E3D9F7',

        // La escala fría de la pantalla del juego. Duplicada a mano en main.css.
        'sky-high': '#CFE6FB',
        'sky-mist': '#EDF5FD',
        mist: {
          DEFAULT: '#F8FBFE',
          soft: '#EFF4FA',
          line: '#DFE8F2',
        },

        // La tinta del pergamino de las misiones. Duplicada a mano en main.css.
        sepia: {
          DEFAULT: '#6B4423',
          soft: '#8A6440',
        },

        // La talla de las tablas de los logros. Duplicada a mano en main.css.
        wood: {
          ink: '#4A2A12',
          light: '#F6C49A',
          bare: '#F9DFBA',
          bark: '#AC5C34',
        },

        // Se conservan los nombres anteriores para no romper pantallas antiguas.
        primary: {
          DEFAULT: '#7B3FE4',
          dark: '#5620B0',
          light: '#A77BF3',
        },
        secondary: {
          DEFAULT: '#FFC93C',
          dark: '#D99A00',
          light: '#FFE29A',
        },
        tertiary: {
          DEFAULT: '#17C3B2',
          dark: '#0C8577',
          light: '#6EE6DD',
        },
        neutral: {
          DEFAULT: '#2A1B45',
          dark: '#1A1225',
          light: '#5A5170',
        },
      },
      borderRadius: {
        chunk: '26px',
      },
      boxShadow: {
        chunk: '0 8px 0 rgba(42, 27, 69, 0.12)',
        'chunk-lg': '0 12px 0 rgba(42, 27, 69, 0.14)',
      },
    },
  },
  plugins: [],
};

