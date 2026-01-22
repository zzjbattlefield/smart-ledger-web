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
        // Light Mode
        'light-bg': '#FAFAFA',
        'light-card': '#FFFFFF',
        'light-text': '#18181B',
        'light-text-secondary': '#71717A',
        // Dark Mode (OLED)
        'dark-bg': '#000000',
        'dark-card': '#0A0A0A',
        'dark-text': '#FFFFFF',
        'dark-text-secondary': '#A1A1AA',
        // Brand Colors
        'cta-blue': '#2563EB',
        'income-green': '#22C55E',
        'expense-red': '#EF4444',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
    },
  },
  plugins: [],
}
