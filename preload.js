const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("myGarageDesktop", {
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  checkForUpdates: () => ipcRenderer.invoke("app:check-for-updates")
});
