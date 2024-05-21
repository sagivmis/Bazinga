import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import dotenv from "dotenv"

dotenv.config()

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": process.env
  },
  build: {
    emptyOutDir: true,
    outDir: "dist",
    // Additional configuration to make sure Vite works well with Electron
    rollupOptions: {
      output: {
        format: "cjs"
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
})
