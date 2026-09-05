import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function getBackendPort() {
  try {
    const portFile = path.resolve(__dirname, '../server/.active-port');
    if (fs.existsSync(portFile)) {
      const p = fs.readFileSync(portFile, 'utf8').trim();
      const parsed = parseInt(p, 10);
      if (parsed > 0) return parsed;
    }
  } catch (e) {}
  return 5000;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        router: () => {
          const port = getBackendPort();
          return `http://127.0.0.1:${port}`;
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-charts': ['recharts'],
          'vendor-export': ['jspdf', 'jspdf-autotable', 'xlsx'],
        },
      },
    },
  },
});


