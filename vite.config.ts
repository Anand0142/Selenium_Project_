import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    open: true, // Automatically open browser
    hmr: {
      overlay: true, // Show errors as overlay
    },
    watch: {
      usePolling: true, // Use polling for file changes
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "three": path.resolve(__dirname, "./node_modules/three"), // Add Three.js alias
    },
  },
  build: {
    sourcemap: true, // Generate sourcemaps for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
  // Add logging
  logLevel: 'info',
}));
