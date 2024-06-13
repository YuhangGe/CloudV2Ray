import path from 'path';
import { networkInterfaces } from 'os';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import imagemin from 'unplugin-imagemin/vite';

let IPv4 = '';
Object.entries(networkInterfaces()).some(([, nets]) => {
  if (!nets) return false;
  return nets.some((net) => {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
    if (net.family === familyV4Value && !net.internal) {
      IPv4 = net.address;
      return true;
    } else {
      return false;
    }
  });
});

// https://vitejs.dev/config/
export default defineConfig({
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: '0.0.0.0',
    hmr: {
      protocol: 'ws',
      host: IPv4,
      port: 1421,
    },
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  plugins: [
    react(),
    imagemin({
      mode: 'sharp',
    }),
    tsconfigPaths({
      projects: [path.resolve(__dirname, '../tsconfig.json')],
    }),
  ],
});
