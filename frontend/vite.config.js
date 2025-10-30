import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      all: true,
      lines: 90,
      functions: 90,
      statements: 90,
      branches: 80,
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.config.js',
        'dist/',
        'src/pages/auth/ProfilePage.jsx',
      ],
    },
  },
})
