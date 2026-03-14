import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), react()
  ],
  base: '/terminal/tesoreria/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', // ✅ Escuchar en todas las interfaces de red
    port: 5173,       // Puerto (puedes cambiarlo)
  }
})
