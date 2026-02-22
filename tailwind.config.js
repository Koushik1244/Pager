/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class", // theme switching via .dark on <html> or <body>

  content: ["./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        // Core brand accent (same for light & dark)
        primary: "#866bff",

        // Semantic text colors
        textMainLight: "#282828",
        textMainDark: "#e6e6e6",
        textMutedDark: "#998dce",

        // Background layers
        backgroundLight: "#f6f5f8", // light mode page background
        backgroundDark: "#130f23", // deep dark for high contrast

        // Surface / card colors
        cardLight: "#ffffff",
        cardDark: "#1d1736",

        // Neutral dark (for chips, nav, etc.)
        neutralDark: "#282828",

        // Borders
        borderLight: "#E5E7EB",
        borderDark: "#1F1F23",
      },

      fontFamily: {
        // Use this everywhere: font-display
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },

      borderRadius: {
        // Light mode reference (rounded)
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },

      boxShadow: {
        // Soft glow for accent buttons / FAB
        glow: "0 0 30px rgba(134, 107, 255, 0.35)",
      },

      backdropBlur: {
        xs: "2px",
        md: "12px",
      },
    },
  },

  plugins: [],
};
