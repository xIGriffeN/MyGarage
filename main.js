const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 650,
    backgroundColor: "#0b0c0e",
    icon: path.join(__dirname, "app", "MyGarage.ico"),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, "app", "index.html"));

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}

app.whenReady().then(() => {
  createWindow();

  // Nach jedem Start auf neue Releases prüfen.
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => console.log("Update check:", err.message));
  }, 2500);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on("update-available", async (info) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "MyGarage Update",
    message: `MyGarage ${info.version} ist verfügbar.`,
    detail: "Möchtest du das Update jetzt herunterladen?",
    buttons: ["Update herunterladen", "Später"],
    defaultId: 0,
    cancelId: 1
  });

  if (result.response === 0) {
    autoUpdater.downloadUpdate().catch(err => {
      dialog.showErrorBox("Update-Fehler", err.message);
    });
  }
});

autoUpdater.on("download-progress", (p) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setProgressBar(p.percent / 100);
  }
});

autoUpdater.on("update-downloaded", async (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setProgressBar(-1);

  const result = await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "Update bereit",
    message: `MyGarage ${info.version} wurde heruntergeladen.`,
    detail: "MyGarage kann jetzt neu gestartet und aktualisiert werden.",
    buttons: ["Jetzt installieren", "Beim Beenden"],
    defaultId: 0
  });

  if (result.response === 0) {
    autoUpdater.quitAndInstall(false, true);
  }
});

autoUpdater.on("error", (err) => {
  console.log("Updater:", err.message);
});
