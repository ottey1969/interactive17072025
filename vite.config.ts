import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async () => {
  const plugins = [
    react(),
  ];

  // Conditionally add cartographer plugin
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    const cartographerModule = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographerModule.cartographer());
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        external: ["zod/v4/core"],
      },
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});

