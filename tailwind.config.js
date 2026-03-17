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
        // Category Colors - Light
        'cat-red': '#FEE2E2',
        'cat-red-text': '#DC2626',
        'cat-orange': '#FFEDD5',
        'cat-orange-text': '#EA580C',
        'cat-yellow': '#FEF9C3',
        'cat-yellow-text': '#CA8A04',
        'cat-green': '#DCFCE7',
        'cat-green-text': '#16A34A',
        'cat-teal': '#CCFBF1',
        'cat-teal-text': '#0D9488',
        'cat-blue': '#DBEAFE',
        'cat-blue-text': '#2563EB',
        'cat-purple': '#F3E8FF',
        'cat-purple-text': '#9333EA',
        'cat-pink': '#FCE7F3',
        'cat-pink-text': '#DB2777',
        // Category Colors - Dark
        'cat-red-dark': '#450A0A',
        'cat-red-dark-text': '#FCA5A5',
        'cat-orange-dark': '#431407',
        'cat-orange-dark-text': '#FDBA74',
        'cat-yellow-dark': '#422006',
        'cat-yellow-dark-text': '#FDE047',
        'cat-green-dark': '#052E16',
        'cat-green-dark-text': '#86EFAC',
        'cat-teal-dark': '#042F2E',
        'cat-teal-dark-text': '#5EEAD4',
        'cat-blue-dark': '#172554',
        'cat-blue-dark-text': '#93C5FD',
        'cat-purple-dark': '#3B0764',
        'cat-purple-dark-text': '#D8B4FE',
        'cat-pink-dark': '#500724',
        'cat-pink-dark-text': '#F9A8D4',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
        'fab': '0 4px 14px rgba(37,99,235,0.4)',
      },
    },
  },
  plugins: [],
}
