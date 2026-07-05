/**
 * Ensures Electron binary is extracted on Windows when npm postinstall fails.
 * Run automatically via package.json postinstall, or manually: node scripts/install-electron.cjs
 */
const { downloadArtifact } = require("@electron/get")
const extract = require("extract-zip")
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const electronDir = path.join(__dirname, "..", "node_modules", "electron")
const distDir = path.join(electronDir, "dist")
const exePath = path.join(distDir, "electron.exe")
const pathFile = path.join(electronDir, "path.txt")
const version = require(path.join(electronDir, "package.json")).version

async function main() {
  if (fs.existsSync(exePath) && fs.existsSync(pathFile)) {
    console.log("Electron already installed.")
    return
  }

  console.log(`Installing Electron ${version} binary...`)

  const zipPath = await downloadArtifact({
    version,
    artifactName: "electron",
    platform: process.platform,
    arch: process.arch,
    force: true
  })

  fs.rmSync(distDir, { recursive: true, force: true })
  fs.mkdirSync(distDir, { recursive: true })

  // extract-zip can hang on some Windows setups; PowerShell is more reliable
  if (process.platform === "win32") {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${distDir.replace(/'/g, "''")}' -Force"`,
      { stdio: "inherit" }
    )
  } else {
    await extract(zipPath, { dir: distDir })
  }

  if (!fs.existsSync(exePath) && process.platform !== "win32") {
    throw new Error("Electron binary not found after extract")
  }

  if (process.platform === "win32" && !fs.existsSync(exePath)) {
    throw new Error(`electron.exe not found at ${exePath}`)
  }

  fs.writeFileSync(pathFile, process.platform === "win32" ? "electron.exe" : "electron")
  console.log("Electron installed successfully.")
}

main().catch((err) => {
  console.error("Electron install failed:", err)
  process.exit(1)
})
