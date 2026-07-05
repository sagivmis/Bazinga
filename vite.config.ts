import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  root: ".",
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: path.resolve(__dirname, "index.html")
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/renderer"),
      "@shared": path.resolve(__dirname, "./src/shared")
    }
  },
  server: {
    port: 5173
  }
})
