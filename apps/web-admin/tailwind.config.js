/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#E8EEF4',
          100: '#C5D4E4',
          500: '#2E86AB',
          700: '#1E5F8F',
          900: '#1E3A5F',
        },
      },
    },
  },
  plugins: [],
};
