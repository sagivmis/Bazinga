import { BrowserWindow } from "electron"
import path from "path"
import type { HeatmapLabBootstrap } from "../shared/backtestSweepTypes"

let heatmapWindow: BrowserWindow | null = null
let bootstrapConfig: HeatmapLabBootstrap | null = null

export function setHeatmapBootstrap(config: HeatmapLabBootstrap) {
  bootstrapConfig = config
}

export function getHeatmapBootstrap() {
  return bootstrapConfig
}

export function openHeatmapLab(isDev: boolean) {
  if (heatmapWindow && !heatmapWindow.isDestroyed()) {
    heatmapWindow.focus()
    return heatmapWindow
  }

  heatmapWindow = new BrowserWindow({
    width: 1680,
    height: 960,
    minWidth: 1200,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: "#0a0e17",
    title: "Bazinga — Heatmap Lab",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  heatmapWindow.setMenu(null)

  if (isDev) {
    void heatmapWindow.loadURL("http://localhost:5173/heatmap-lab")
  } else {
    void heatmapWindow.loadFile(path.join(__dirname, "../../dist/index.html"), {
      hash: "/heatmap-lab"
    })
  }

  heatmapWindow.on("closed", () => {
    heatmapWindow = null
  })

  return heatmapWindow
}

export function getHeatmapWindow() {
  return heatmapWindow
}
