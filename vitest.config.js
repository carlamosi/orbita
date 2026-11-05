import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Separate from vite.config.js so tests don't load the PWA plugin.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // process.env.TZ in the setup file only applies reliably in forked processes.
    pool: 'forks',
    setupFiles: ['src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
