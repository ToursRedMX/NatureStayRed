/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f0',
          100: '#dcecdc',
          200: '#bbd6bb',
          300: '#8fbd8f',
          400: '#5e9b5e',
          500: '#3d7a3d',
          600: '#2d6129',
          700: '#244d22',
          800: '#1d3d1c',
          900: '#163016',
          950: '#0a1c0a',
        },
        terracotta: {
          50: '#fdf5f0',
          100: '#f9e6d8',
          200: '#f0cbb0',
          300: '#e4a87f',
          400: '#d4824f',
          500: '#c26530',
          600: '#a84e24',
          700: '#873c1f',
          800: '#6e321d',
          900: '#5b2b1a',
          950: '#321510',
        },
        sand: {
          50: '#faf8f3',
          100: '#f3eee0',
          200: '#e6dcc4',
          300: '#d4c59e',
          400: '#c0ab78',
          500: '#ad985f',
          600: '#998452',
          700: '#7e6c46',
          800: '#68593d',
          900: '#564934',
          950: '#312820',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
