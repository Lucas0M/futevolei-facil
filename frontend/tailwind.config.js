/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0B0F19",
          card: "#131B2E",
          accent: "#10B981", // Verde Esmeralda Premium
          accentHover: "#059669",
        },
      },
    },
  },
  plugins: [],
};
