import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Detect cloud environment
  const isCloudEnvironment =
    process.env.NODE_ENV === "production" ||
    process.env.FLY_APP_NAME ||
    process.env.VERCEL ||
    process.env.NETLIFY;

  // Cloud-specific configuration
  const serverConfig = isCloudEnvironment
    ? {
        // Production/cloud settings - disable HMR to prevent fetch errors
        host: "0.0.0.0",
        port: 8080,
        hmr: false, // Disable HMR in cloud environments
        watch: {
          ignored: ["**/node_modules/**"],
        },
      }
    : {
        // Local development settings
        host: "0.0.0.0",
        port: 8080,
        watch: {
          usePolling: true,
        },
        hmr: {
          port: 8080,
          host: "localhost",
        },
      };

  return {
    server: serverConfig,
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
    test: {
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/backend/**",
        "**/backend-nestjs/**",
        "**/matching-service/**",
        "**/.next/**",
      ],
      include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    },
  };
});
