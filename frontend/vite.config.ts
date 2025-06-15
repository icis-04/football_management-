import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses
    port: 5173,
    strictPort: false,
    // Workaround for allowedHosts bug - use wildcard pattern
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', 'localhost', '127.0.0.1'],
    hmr: {
      overlay: true,
      host: 'localhost'
    }
  },
  // Allow all hosts in preview mode as well
  preview: {
    host: true,
    port: 5173,
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', 'localhost', '127.0.0.1']
  }
})
