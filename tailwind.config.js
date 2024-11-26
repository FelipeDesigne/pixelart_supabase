/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#A4FF43',
        secondary: '#8BD030',
        dark: {
          DEFAULT: '#0E1A23',
          lighter: '#142830',
          accent: '#1A1F27',
        },
      },
    },
  },
  plugins: [],
};