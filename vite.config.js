import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The three.js vendor chunk is large by nature; do not warn about it.
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        // Heavy, rarely-changing libraries get their own chunk so the app shell
        // stays small and the 3D moment can load lazily.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/three/') || id.includes('@react-three')) return 'three';
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) return 'charts';
          if (id.includes('framer-motion')) return 'motion';
          return undefined;
        },
      },
    },
  },
});
