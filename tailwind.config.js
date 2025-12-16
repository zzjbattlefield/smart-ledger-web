/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // iOS System Colors reference
        ios: {
          background: "#F2F2F7", // System Grouped Background
          card: "#FFFFFF",
          text: "#000000",
          subtext: "#8E8E93",
          separator: "#C6C6C8",
          blue: "#007AFF",
          green: "#34C759",
          red: "#FF3B30",
          orange: "#FF9500",
          yellow: "#FFCC00",
          purple: "#AF52DE",
          teal: "#5AC8FA",
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "San Francisco",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      boxShadow: {
        'ios-sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'ios-md': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'ios-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
