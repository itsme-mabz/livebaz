import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173, // your frontend dev server port
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Backend is running on port 3000
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
