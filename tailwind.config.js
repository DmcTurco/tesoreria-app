/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
  ],

  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1a2e4a",
          light: "#243d5e",
        },
        gold: {
          DEFAULT: "#c8960c",
          light: "#f5c842",
        },
      },
      fontFamily: {
        sans: ["Nunito", "Segoe UI", "sans-serif"],
      },
    },
  },

  // Clases dinámicas generadas en arrays/objetos de datos que el JIT no puede detectar
  safelist: [
    // Fondos usados en ROLES
    "bg-[#1a2e4a]",
    "bg-[#1a4a3a]",
    "bg-[#2c1a4a]",
    // Colores de ícono
    "text-[#c8960c]",
    "text-emerald-400",
    "text-purple-400",
    // Bordes hover
    "hover:border-[#c8960c]",
    "hover:border-emerald-400",
    "hover:border-purple-400",
    // Sombras hover
    "hover:shadow-[0_12px_32px_rgba(200,150,12,0.18)]",
    "hover:shadow-[0_12px_32px_rgba(46,204,113,0.18)]",
    "hover:shadow-[0_12px_32px_rgba(155,89,182,0.18)]",
  ],

  plugins: [
    require("flowbite/plugin"),
  ],
};