const { app, BrowserWindow, dialog, ipcMain, protocol, Notification, clipboard } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { autoUpdater } = require("electron-updater");

let mainWindow;

protocol.registerSchemesAsPrivileged([
  { scheme: "jiggy-image", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

function vehicleImageCacheDir() {
  const dir = path.join(app.getPath("userData"), "vehicle-image-cache");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function registerVehicleImageProtocol() {
  protocol.registerFileProtocol("jiggy-image", (request, callback) => {
    try {
      const u = new URL(request.url);
      const filename = path.basename(decodeURIComponent(u.pathname || ""));
      callback({ path: path.join(vehicleImageCacheDir(), filename) });
    } catch {
      callback({ error: -6 });
    }
  });
}


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 650,
    backgroundColor: "#0b0c0e",
    icon: path.join(__dirname, "app", "JIGGY.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, "app", "index.html"));

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}

let manualUpdateCheck = false;

ipcMain.handle("app:get-version", () => app.getVersion());
ipcMain.handle("app:notify", (_event, payload = {}) => {
  try {
    if (!Notification.isSupported()) return { ok:false, error:"Benachrichtigungen werden nicht unterstützt." };
    const title = String(payload.title || "JIGGY").slice(0, 80);
    const body = String(payload.body || "").slice(0, 220);
    new Notification({
      title,
      body,
      icon: path.join(__dirname, "app", "JIGGY.png")
    }).show();
    return { ok:true };
  } catch (e) {
    return { ok:false, error:e.message };
  }
});

ipcMain.handle("vehicle:save-pdf", async (_event, payload = {}) => {
  const html = String(payload.html || "");
  if (!html || html.length > 8_000_000) return { ok:false, error:"Ungültiger PDF-Inhalt." };
  const rawName = String(payload.suggestedName || "JIGGY-Fahrzeugakte.pdf").replace(/[\\/:*?"<>|]/g, "-").slice(0, 140);
  const chosen = await dialog.showSaveDialog(mainWindow, { title:"JIGGY Fahrzeugakte speichern", defaultPath:path.join(app.getPath("documents"), rawName.endsWith(".pdf") ? rawName : rawName + ".pdf"), filters:[{name:"PDF",extensions:["pdf"]}] });
  if (chosen.canceled || !chosen.filePath) return { ok:false, canceled:true };
  let reportWindow;
  try {
    reportWindow = new BrowserWindow({ show:false, webPreferences:{ sandbox:true, contextIsolation:true, nodeIntegration:false } });
    await reportWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`);
    const pdf = await reportWindow.webContents.printToPDF({ printBackground:true, pageSize:"A4", margins:{ marginType:"none" }, preferCSSPageSize:true });
    fs.writeFileSync(chosen.filePath, pdf);
    return { ok:true, path:chosen.filePath };
  } catch (e) {
    return { ok:false, error:e.message };
  } finally {
    try { reportWindow?.destroy(); } catch {}
  }
});

function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}


ipcMain.handle("vehicle:decode-vin", async (_event, payload = {}) => {
  const vin = String(payload.vin || "").trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
  const modelYear = String(payload.modelYear || "").trim().slice(0, 4);
  if (vin.length !== 17) return { ok: false, error: "Eine VIN muss genau 17 Zeichen haben." };

  try {
    const params = new URLSearchParams({ format: "json" });
    if (/^\d{4}$/.test(modelYear)) params.set("modelyear", modelYear);
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "JIGGY/1.7.0 VIN Decoder",
        "Accept": "application/json"
      }
    });
    if (!response.ok) throw new Error(`VIN-Service HTTP ${response.status}`);
    const data = await response.json();
    const r = data?.Results?.[0] || {};

    const errorCode = String(r.ErrorCode || "").split(",").map(x => x.trim()).filter(Boolean);
    const hasHardError = errorCode.some(x => !["0","10","11","14"].includes(x));
    const make = r.Make || "";
    const model = r.Model || "";
    const year = Number(r.ModelYear || modelYear || 0) || 0;

    if (!make && !model && hasHardError) {
      return { ok: false, error: r.ErrorText || "Die VIN konnte nicht eindeutig decodiert werden." };
    }

    const engineLiters = r.DisplacementL || "";
    const cylinders = r.EngineCylinders || "";
    const engineModel = r.EngineModel || r.EngineConfiguration || "";
    const fuel = r.FuelTypePrimary || r.FuelTypeSecondary || "";
    const body = r.BodyClass || "";
    const drive = r.DriveType || "";
    const plantCountry = r.PlantCountry || "";
    const plantCity = r.PlantCity || "";
    const series = r.Series || r.Trim || "";
    const doors = r.Doors || "";
    const manufacturer = r.Manufacturer || "";
    const vehicleType = r.VehicleType || "";

    return {
      ok: true,
      vin,
      rawError: r.ErrorText || "",
      data: {
        make, model, year, series, fuel, body, drive,
        engineLiters, cylinders, engineModel,
        plantCountry, plantCity, doors, manufacturer, vehicleType
      }
    };
  } catch (err) {
    console.log("VIN decode:", err.message);
    return { ok: false, error: "VIN-Abfrage fehlgeschlagen: " + err.message };
  }
});

ipcMain.handle("vehicle:example-image", async (_event, payload = {}) => {
  const rawQuery = String(payload.query || "").trim().slice(0, 140);
  const skip = Math.max(0, Math.min(Number(payload.skip) || 0, 12));
  if (!rawQuery) return { ok: false, error: "Kein Fahrzeug angegeben" };

  const cacheDir = vehicleImageCacheDir();
  const queryHash = crypto.createHash("sha1").update(`${rawQuery}|${skip}`).digest("hex").slice(0, 18);
  const cached = fs.readdirSync(cacheDir).find(x => x.startsWith(queryHash + "."));
  if (cached) {
    return {
      ok: true,
      url: `jiggy-image://cache/${cached}`,
      sourceUrl: "",
      title: rawQuery,
      artist: "",
      license: "Wikimedia Commons",
      source: "Wikimedia Commons"
    };
  }

  const simplify = q => q
    .replace(/\b(quattro|4matic\+?|4matic|xdrive|4drive|4motion|awd|all4|dsg|dct|tiptronic|s tronic|steptronic|automatik|manuell)\b/gi, " ")
    .replace(/\b\d\.\d\s*(tdi|tfsi|tsi|turbo|v6|v8|boxer|ecoboost|skyactiv-[a-z])\b/gi, " ")
    .replace(/\s+/g, " ").trim();

  const parts = rawQuery.split(/\s+/);
  const queries = [...new Set([
    `${rawQuery} car`,
    `${simplify(rawQuery)} car`,
    `${parts.slice(0, 3).join(" ")} car`,
    `${parts.slice(0, 2).join(" ")} automobile`
  ].filter(q => q.length > 5))];

  try {
    let candidates = [];
    for (const searchQuery of queries) {
      const params = new URLSearchParams({
        action: "query",
        generator: "search",
        gsrnamespace: "6",
        gsrlimit: "30",
        gsrsearch: searchQuery,
        prop: "imageinfo",
        iiprop: "url|mime|size|extmetadata",
        iiurlwidth: "1100",
        format: "json",
        origin: "*"
      });

      const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {
        headers: {
          "User-Agent": "JIGGY/1.7.0 (vehicle example image cache)",
          "Accept": "application/json"
        }
      });
      if (!response.ok) continue;
      const data = await response.json();

      const bad = /logo|badge|emblem|engine|interior|wheel|steering|diagram|drawing|map|museum|detail|grille|headlight|dashboard|brochure|advert|render/i;
      const terms = simplify(rawQuery).toLowerCase().split(/\s+/).filter(t => t.length > 2);

      const pages = Object.values(data?.query?.pages || {}).filter(p => {
        const ii = p?.imageinfo?.[0];
        if (!ii || !/image\/(jpeg|png|webp)/i.test(ii.mime || "")) return false;
        if (bad.test(p.title || "")) return false;
        const w = Number(ii.width || 0), h = Number(ii.height || 0);
        if (w && h && (w < 500 || h < 300)) return false;
        return true;
      }).map(p => {
        const title = (p.title || "").toLowerCase();
        const score = terms.reduce((n, t) => n + (title.includes(t) ? 3 : 0), 0)
          + (/front|side|parked|road|avant|sportback|coupe|coupé|sedan|wagon|touring/i.test(title) ? 1 : 0);
        return { p, score };
      });

      candidates.push(...pages);
      if (candidates.length >= 12) break;
    }

    // de-duplicate pages and rank
    const seen = new Set();
    candidates = candidates
      .filter(x => {
        const k = x.p.pageid || x.p.title;
        if (seen.has(k)) return false;
        seen.add(k); return true;
      })
      .sort((a, b) => b.score - a.score);

    const chosen = candidates[skip] || candidates[0];
    if (!chosen) return { ok: false, error: "Kein geeignetes Beispielbild gefunden" };

    const page = chosen.p;
    const ii = page.imageinfo[0];
    const imageUrl = ii.thumburl || ii.url;
    const imageResponse = await fetch(imageUrl, {
      headers: { "User-Agent": "JIGGY/1.7.0 vehicle-image-cache" }
    });
    if (!imageResponse.ok) throw new Error(`Bilddownload HTTP ${imageResponse.status}`);

    const contentType = (imageResponse.headers.get("content-type") || ii.mime || "image/jpeg").toLowerCase();
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `${queryHash}.${ext}`;
    const filePath = path.join(cacheDir, filename);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const meta = ii.extmetadata || {};
    return {
      ok: true,
      url: `jiggy-image://cache/${filename}`,
      originalUrl: ii.url,
      sourceUrl: ii.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      title: page.title.replace(/^File:/i, ""),
      artist: stripHtml(meta.Artist?.value || meta.Credit?.value || "Wikimedia Commons"),
      license: stripHtml(meta.LicenseShortName?.value || meta.UsageTerms?.value || "Wikimedia Commons"),
      source: "Wikimedia Commons"
    };
  } catch (err) {
    console.log("Vehicle image:", err.message);
    return { ok: false, error: "Bildsuche fehlgeschlagen: " + err.message };
  }
});

ipcMain.handle("app:copy-text", async (_event, text) => {
  try {
    clipboard.writeText(String(text || ""));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle("app:check-for-updates", async () => {
  manualUpdateCheck = true;
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (err) {
    manualUpdateCheck = false;
    return { ok: false, error: err.message };
  }
});

autoUpdater.on("update-not-available", async () => {
  if (!manualUpdateCheck) return;
  manualUpdateCheck = false;
  if (mainWindow && !mainWindow.isDestroyed()) {
    await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "JIGGY Update",
      message: "JIGGY ist aktuell.",
      detail: `Du verwendest bereits Version ${app.getVersion()}.`,
      buttons: ["OK"]
    });
  }
});

app.whenReady().then(() => {
  registerVehicleImageProtocol();
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
  manualUpdateCheck = false;
  const result = await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "JIGGY Update",
    message: `JIGGY ${info.version} ist verfügbar.`,
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
    message: `JIGGY ${info.version} wurde heruntergeladen.`,
    detail: "JIGGY kann jetzt neu gestartet und aktualisiert werden.",
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
