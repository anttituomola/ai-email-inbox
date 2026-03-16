/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#eef0ff',
          100: '#e0e4ff',
          200: '#c7d0ff',
          300: '#a3b2ff',
          400: '#7a8bff',
          500: '#5244f8',
          600: '#371feb',
          700: '#2800d4',
          800: '#1d00a8',
          900: '#14007d',
          950: '#0e0052',
        },
      },
      keyframes: {
        'fade-in-right': {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-out-left': {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-10px)' },
        },
        'highlight-pulse': {
          '0%': { backgroundColor: '#dbeafe' }, // blue-100
          '100%': { backgroundColor: '#eff6ff' }, // blue-50
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'button-attention': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)' },
        }
      },
      animation: {
        'fade-in-right': 'fade-in-right 0.2s ease-out forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'slide-out-left': 'slide-out-left 0.2s ease-in forwards',
        'highlight-pulse': 'highlight-pulse 0.5s ease-out forwards',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'button-attention': 'button-attention 1.5s ease-in-out 1',
      }
    },
  },
  plugins: [],
}
