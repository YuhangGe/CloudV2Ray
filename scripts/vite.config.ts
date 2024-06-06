import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 1420,
  },
  plugins: [
    react(),
    tsconfigPaths({
      projects: [path.resolve(__dirname, '../tsconfig.json')],
    }),
  ],
});
