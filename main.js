import { app, BrowserWindow, screen } from "electron"

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.8),
    height: Math.floor(height * 0.6),
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Set this to false if using nodeIntegration without preload scripts
    }
  })

  mainWindow.setMenu(null)
  mainWindow.loadURL("http://localhost:5173/")
  mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
})

app.on("window-all-closed", () => {
  app.quit()
})
