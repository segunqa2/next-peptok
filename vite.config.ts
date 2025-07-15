import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    watch: {
      usePolling: true,
    },
    hmr: {
      port: 8080,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Only allow TypeScript and TSX files
    include: /\.(ts|tsx)$/,
    exclude: /\.(js|jsx)$/,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
