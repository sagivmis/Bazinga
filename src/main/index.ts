import { config } from "dotenv"
import { app, BrowserWindow } from "electron"
import path from "path"
import { registerIpcHandlers } from "./ipc/handlers"
import { BinanceService } from "./services/BinanceService"
import { SettingsService } from "./services/SettingsService"
import { initSecrets } from "./secrets"
import { broadcast } from "./broadcast"

// Load .env from project root (fallback for API keys in dev)
config({ path: path.join(__dirname, "../../.env") })

let mainWindow: BrowserWindow | null = null
let binanceService: BinanceService | null = null

const isDev = !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: "#0a0e17",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox breaks preload's require() — window.api never loads
      sandbox: false
    }
  })

  mainWindow.setMenu(null)

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173")
    mainWindow.webContents.openDevTools({ mode: "detach" })
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"))
  }

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

export function getMainWindow() {
  return mainWindow
}

export function getBinanceService() {
  return binanceService
}

app.whenReady().then(async () => {
  const settings = new SettingsService()
  initSecrets(settings)
  binanceService = new BinanceService(settings, (channel, payload) => {
    broadcast(channel, payload)
  })

  registerIpcHandlers(settings, binanceService)
  createWindow()

  mainWindow?.webContents.on("did-finish-load", () => {
    void binanceService?.ping()
  })

  try {
    await binanceService.connect()
  } catch (err) {
    console.error("Binance connect failed:", err)
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  binanceService?.disconnect()
  app.quit()
})
