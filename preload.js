const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("myGarageDesktop", {
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  checkForUpdates: () => ipcRenderer.invoke("app:check-for-updates"),
  getVehicleImage: (query, skip = 0) => ipcRenderer.invoke("vehicle:example-image", { query, skip }),
  decodeVin: (vin, modelYear = "") => ipcRenderer.invoke("vehicle:decode-vin", { vin, modelYear })
});
