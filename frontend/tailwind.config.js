/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e6f7ff',
          200: '#bae6ff',
          300: '#7fd4ff',
          400: '#40bfff',
          500: '#1fb6ff',
          600: '#0096f6',
          700: '#0077d1',
          800: '#0056a8',
          900: '#003b7a'
        },
        qwipo: {
          primary: '#6366f1',
          secondary: '#ec4899'
        },
        brand: {
          50: '#fff8f1',
          100: '#fff1e6',
          200: '#ffd8b3',
          300: '#ffb86b',
          400: '#ff9a3d',
          500: '#ff7a05',
          600: '#ff6a00',
          700: '#e55a00',
          800: '#b84a00',
          900: '#8a3800'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
