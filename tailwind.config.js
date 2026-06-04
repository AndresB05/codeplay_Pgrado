/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#855CD6',
          dark: '#6B429B',
          light: '#A78BEB',
        },
        secondary: {
          DEFAULT: '#FFB840',
          dark: '#E09820',
          light: '#FFD870',
        },
        tertiary: {
          DEFAULT: '#4ECDC4',
          dark: '#3BA89F',
          light: '#6EE6DD',
        },
        neutral: {
          DEFAULT: '#2D203A',
          dark: '#1A1225',
          light: '#4A3A5A',
        },
        colombia: {
          yellow: '#F5C518',
          blue: '#003087',
          red: '#CE1126',
          background: '#0D1B2A',
        },
      },
    },
  },
  plugins: [],
};
