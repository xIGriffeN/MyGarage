const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("myGarageDesktop", {
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  checkForUpdates: () => ipcRenderer.invoke("app:check-for-updates"),
  copyText: (text) => ipcRenderer.invoke("app:copy-text", text),
  getVehicleImage: (query, skip = 0) => ipcRenderer.invoke("vehicle:example-image", { query, skip }),
  decodeVin: (vin, modelYear = "") => ipcRenderer.invoke("vehicle:decode-vin", { vin, modelYear }),
  notify: (title, body) => ipcRenderer.invoke("app:notify", { title, body }),
  saveVehiclePdf: (payload) => ipcRenderer.invoke("vehicle:save-pdf", payload)
});
