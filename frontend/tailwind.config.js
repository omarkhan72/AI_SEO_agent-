/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a',
        darkPanel: '#1e293b',
        lightBg: '#f8fafc',
        lightPanel: '#ffffff',
      }
    },
  },
  plugins: [],
}
