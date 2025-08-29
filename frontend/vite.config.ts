import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/todo': 'http://localhost:3333',
      '/todos': 'http://localhost:3333',
      '/auth': 'http://localhost:3333'
    }
  }
})
