import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Configure Vite for Electron
    emptyOutDir: true,
    outDir: "dist"
  }
})
