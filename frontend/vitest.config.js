import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for DOM testing
    environment: 'jsdom',
    
    // Global test utilities
    globals: true,
    
    // Setup files
    setupFiles: ['./src/__tests__/setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // Files to include in coverage
      include: ['src/**/*.{js,jsx}'],
      
      // Files to exclude from coverage
      exclude: [
        'src/main.jsx',
        'src/**/*.test.{js,jsx}',
        'src/**/__tests__/**',
        'src/vite-env.d.ts',
        '**/*.config.{js,ts}',
      ],
      
      // Coverage thresholds (90% required for UC-035)
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Ignore patterns
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
