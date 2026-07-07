/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        brand: {
          // Backgrounds
          background: "#05080F",
          surface: "#0A101B",
          card: "#101826",
          cardHover: "#172233",

          // Borders
          border: "#263345",
          borderLight: "#334155",

          // Primary
          primary: "#22C55E",
          primaryHover: "#16A34A",
          primarySoft: "#22C55E20",

          // Text
          white: "#F8FAFC",
          text: "#CBD5E1",
          muted: "#94A3B8",

          // Status
          success: "#22C55E",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#3B82F6",
        },

        glow: {
          green: "rgba(34,197,94,.35)",
        },
      },

      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.15rem",
      },

      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,.25)",
        glow: "0 0 30px rgba(34,197,94,.25)",
        "glow-lg": "0 0 60px rgba(34,197,94,.35)",
      },

      backgroundImage: {
        hero: "radial-gradient(circle at top, rgba(34,197,94,.10), transparent 40%)",
        app: "linear-gradient(180deg,#05080F 0%,#09111D 45%,#05080F 100%)",
        card: "linear-gradient(180deg,#101826 0%,#0D1522 100%)",
      },

      transitionTimingFunction: {
        smooth: "cubic-bezier(.22,.61,.36,1)",
      },
    },
  },

  plugins: [],
};
