/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CineMatch Brand Colors from Revision Plan
        brand: {
          primary: '#FF4C29',
          secondary: '#FFD369',
          dark: '#121212',
          cardBg: '#1F1F1F',
          textLight: '#FFFFFF',
          textSubtle: '#B0B0B0',
        },
        slate: {
          750: '#334155',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontSize: {
        '2xs': '0.625rem',
      },
    },
  },
  plugins: [],
  safelist: [
    'line-clamp-2',
    'line-clamp-3',
    'compact-mode',
  ]
};