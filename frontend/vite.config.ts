import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/health': 'http://127.0.0.1:8000',
      '/destinations': 'http://127.0.0.1:8000',
      '/places': 'http://127.0.0.1:8000',
      '/recommendations': 'http://127.0.0.1:8000',
      '/trips': 'http://127.0.0.1:8000',
      '/evaluation': 'http://127.0.0.1:8000',
    }
  }
})
