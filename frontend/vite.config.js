import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  // Get backend URL from env, default to port 5000
  const backendUrl = env.VITE_API_BASE_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 5173,
    },
    // ============================================================================
    // Build optimizations for performance
    // ============================================================================
    build: {
      // Enable minification with esbuild (faster) or terser (smaller)
      minify: 'esbuild',
      // Generate source maps for production debugging (optional - disable for smallest build)
      sourcemap: false,
      // Target modern browsers for smaller bundles
      target: 'es2020',
      // Rollup options for advanced optimizations
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor chunks - split large dependencies
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-ui': ['lucide-react', '@heroicons/react'],
            'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html2canvas'],
            'vendor-editor': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-placeholder'],
            'vendor-maps': ['leaflet', 'react-leaflet'],
            'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', 'react-dnd', 'react-dnd-html5-backend'],
          },
          // Asset file naming for better caching
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            if (ext === 'css') {
              return 'assets/css/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      // Increase chunk size warning limit (optional)
      chunkSizeWarningLimit: 500,
      // CSS code splitting
      cssCodeSplit: true,
      // Inline assets smaller than 4kb
      assetsInlineLimit: 4096,
    },
    // ============================================================================
    // Dependency optimization
    // ============================================================================
    optimizeDeps: {
      // Pre-bundle these dependencies for faster dev server startup
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'lucide-react',
      ],
      // Exclude large dependencies that don't need pre-bundling
      exclude: ['@sentry/react'],
    },
    // ============================================================================
    // CSS optimization
    // ============================================================================
    css: {
      // Enable CSS modules for scoped styles
      modules: {
        localsConvention: 'camelCase',
      },
      // PostCSS config is loaded from postcss.config.js
      devSourcemap: true,
    },
    // ============================================================================
    // Enable esbuild optimizations
    // ============================================================================
    esbuild: {
      // Remove console.log in production
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      // Legal comments handling
      legalComments: 'none',
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.js'],
      globals: true,
      css: true,
      include: ['src/**/*.test.{js,jsx,ts,tsx}', 'src/**/__tests__/**/*.{js,jsx,ts,tsx}'],
    },
  }
})
