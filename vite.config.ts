import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // For GitHub Pages: use repository name as base path
  // For custom domain: change to '/'
  base: '/ai-learning-playground/',
  plugins: [
    react(),
    // Custom plugin to handle base path redirects in dev server
    {
      name: 'base-path-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // If accessing /ai-learning-playground without trailing slash, redirect
          if (req.url === '/ai-learning-playground') {
            res.writeHead(301, { Location: '/ai-learning-playground/' });
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/data': path.resolve(__dirname, './src/data'),
    },
  },
  server: {
    port: 3000,
    open: true,
    // Handle base path redirects in dev server
    // Redirect /ai-learning-playground to /ai-learning-playground/
    middlewareMode: false,
    fs: {
      strict: false,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Copy 404.html for GitHub Pages SPA routing
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts', 'd3'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
