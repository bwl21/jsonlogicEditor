import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
      watch: {
        ignored: ['**/.env', '**/.env.*', '**/node_modules/**', '/usr/local/gitpod/secrets/**'],
      },
    },
})