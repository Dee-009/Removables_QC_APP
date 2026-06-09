import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // Pin a dedicated port so the OAuth redirect URL stays stable even when
  // other apps' dev servers are running. strictPort fails loudly instead of
  // silently drifting to 5175/5176/... (which would break Microsoft sign-in).
  server: {
    port: 5175,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
