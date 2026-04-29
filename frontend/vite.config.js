import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // REST API
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/incidents': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/scanner': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // Socket.IO (WebSocket + polling)
      '/socket.io': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
