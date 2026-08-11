/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        earth: {
          50: '#faf7f2',
          100: '#f4ede2',
          200: '#e7d8c5',
          300: '#d7bea3',
          400: '#c59f7d',
          500: '#b4835e',
          600: '#9b684b',
          700: '#7d503d',
          800: '#674236',
          900: '#55382f',
        },
        agri: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        deepforest: {
          DEFAULT: '#1B4332',
          light: '#2D6A4F',
          dark: '#081C15'
        },
        tealaccent: {
          DEFAULT: '#0077B6',
          light: '#0096C7',
          soft: '#E0F2FE'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        telugu: ['Gidugu', 'Noto Sans Telugu', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
