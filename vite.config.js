/** Vite config — dev server on :5173, React HMR. */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const RUN_SERVER = 'http://localhost:4500';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': { target: RUN_SERVER, changeOrigin: true },
      '/ws': { target: RUN_SERVER, ws: true },
    },
  },
  preview: {
    proxy: {
      '/api': { target: RUN_SERVER, changeOrigin: true },
      '/ws': { target: RUN_SERVER, ws: true },
    },
  },
});
