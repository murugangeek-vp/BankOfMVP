/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bank: {
          navy: '#0B192C',
          dark: '#1E2022',
          card: '#1E293B',
          emerald: '#10B981',
          gold: '#F59E0B',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          danger: '#EF4444',
          slate: '#64748B'
        }
      }
    },
  },
  plugins: [],
}
