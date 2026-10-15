import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Drops console and debugger statements from production bundles
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            // Do not proxy if the request is loading a JavaScript/frontend source file from the local api directory
            if (req.url && (req.url.endsWith('.js') || req.url.endsWith('.jsx') || req.url.endsWith('.ts') || req.url.includes('?') || req.url.includes('@'))) {
              return req.url;
            }
          },
        },
      },

      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },

  };
});
