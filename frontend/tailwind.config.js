/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E15033',
          50:  '#FEF2EE',
          100: '#FCEEE9',
          200: '#F9C9BB',
          300: '#F3987D',
          400: '#EA6847',
          500: '#E15033',
          600: '#C73E22',
          700: '#A0301A',
        },
        ink: '#0A0A0A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ["'Noto Kufi Arabic'", 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '14px',
      },
    },
  },
  plugins: [],
};
