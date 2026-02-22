/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // important for theme switching
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#7C3AED",   // purple
        primaryLight: "#A78BFA",
        primaryDark: "#5B21B6",

        background: "#FFFFFF",
        darkBackground: "#0B0B0F",

        card: "#F9FAFB",
        darkCard: "#111117",

        borderLight: "#E5E7EB",
        borderDark: "#1F1F23",
      },

      boxShadow: {
        glow: "0 0 30px rgba(124,58,237,0.25)",
      },

      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
