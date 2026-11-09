const { app, BrowserWindow, ipcMain, powerMonitor, safeStorage, dialog, shell, Menu, session } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { Vault, writeAtomic } = require('./vault.cjs');
const backups = require('./backups.cjs');

app.setName('Lehrerpult');
if (!app.requestSingleInstanceLock()) app.quit();

const home = app.getPath('userData');
const files = {
  data: path.join(home, 'daten', 'lehrerpult.dat'),
  config: path.join(home, 'einstellungen.json'),
  deviceKey: path.join(home, 'geraeteschluessel.bin'),
  backups: path.join(home, 'sicherungen'),
};

// Einstellungen, die vor dem Entsperren gebraucht werden, liegen unverschlüsselt.
const DEFAULT_CONFIG = { lockMode: 'sperre', idleMinutes: 0, extraBackupDir: null };
function loadConfig() {
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(files.config, 'utf8')) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
let config = loadConfig();
function saveConfig() {
  writeAtomic(files.config, JSON.stringify(config, null, 2));
}

const vault = new Vault(files.data);
let win = null;
let lastBackupDay = null;
let closeConfirmed = false;

// ---------- Geräteschlüssel (Windows-Kontoschutz), damit beim Start kein Passwort nötig ist ----------
function storeDeviceKey() {
  if (config.lockMode !== 'sperre' || !vault.unlocked || !safeStorage.isEncryptionAvailable()) return;
  fs.writeFileSync(files.deviceKey, safeStorage.encryptString(vault.dek.toString('base64')));
}
function removeDeviceKey() {
  fs.rmSync(files.deviceKey, { force: true });
}
function tryDeviceKey() {
  if (config.lockMode !== 'sperre' || !fs.existsSync(files.deviceKey) || !safeStorage.isEncryptionAvailable()) return false;
  try {
    const dek = Buffer.from(safeStorage.decryptString(fs.readFileSync(files.deviceKey)), 'base64');
    return vault.unlockWithKey(dek);
  } catch {
    return false;
  }
}

// ---------- Sicherungen ----------
function runBackup() {
  if (!vault.exists()) return [];
  lastBackupDay = backups.stamp().day;
  return backups.backupAll(files.data, [files.backups, config.extraBackupDir]);
}
function backupIfNewDay() {
  if (lastBackupDay !== backups.stamp().day) runBackup();
}

function afterUnlock() {
  backupIfNewDay();
  return { ok: true, data: vault.read() };
}

// ---------- IPC ----------
const handle = (name, fn) =>
  ipcMain.handle(name, async (_e, ...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

handle('app:status', () => ({ exists: vault.exists(), unlocked: vault.unlocked, config, version: app.getVersion() }));

handle('vault:auto-unlock', () => (tryDeviceKey() ? afterUnlock() : { ok: false }));

handle('vault:setup', (password, data) => {
  if (vault.exists()) return { ok: false, error: 'Es gibt bereits eine Datendatei.' };
  const code = vault.create(password, data);
  storeDeviceKey();
  runBackup();
  return { ok: true, recoveryCode: code };
});

handle('vault:import', async () => {
  const res = await dialog.showOpenDialog(win, {
    title: 'Datendatei auswählen',
    filters: [{ name: 'Lehrerpult-Daten', extensions: ['dat'] }],
    properties: ['openFile'],
  });
  if (res.canceled) return { ok: false };
  const probe = new Vault(res.filePaths[0]);
  probe.readEnvelope(); // wirft bei falschem Format
  fs.mkdirSync(path.dirname(files.data), { recursive: true });
  fs.copyFileSync(res.filePaths[0], files.data);
  return { ok: true };
});

handle('vault:unlock', (password) => {
  if (!vault.unlockWithPassword(password)) return { ok: false, error: 'Das Passwort stimmt nicht.' };
  storeDeviceKey();
  return afterUnlock();
});

handle('vault:recover', (code, newPassword) => {
  if (!vault.resetWithRecovery(code, newPassword)) return { ok: false, error: 'Der Wiederherstellungscode stimmt nicht.' };
  storeDeviceKey();
  return afterUnlock();
});

handle('vault:save', (data) => {
  vault.write(data);
  backupIfNewDay();
  return { ok: true };
});

handle('vault:lock', () => {
  vault.lock();
  return { ok: true };
});

handle('vault:change-password', (oldPw, newPw) => {
  if (!vault.changePassword(oldPw, newPw)) return { ok: false, error: 'Das bisherige Passwort stimmt nicht.' };
  return { ok: true };
});

handle('vault:new-recovery-code', (password) => {
  if (!new Vault(files.data).unlockWithPassword(password)) return { ok: false, error: 'Das Passwort stimmt nicht.' };
  return { ok: true, recoveryCode: vault.newRecoveryCode() };
});

handle('config:set', (patch) => {
  config = { ...config, ...patch };
  saveConfig();
  if (config.lockMode === 'sperre') storeDeviceKey();
  else removeDeviceKey();
  return { ok: true, config };
});

handle('backups:list', () => ({ ok: true, items: backups.list(files.backups), folder: files.backups }));

handle('backups:now', () => {
  const problems = runBackup();
  return { ok: problems.length === 0, error: problems.map((p) => `${p.root}: ${p.message}`).join('\n') };
});

handle('backups:restore', (file) => {
  const data = vault.readBackup(file);
  const safety = path.join(files.backups, 'vor-wiederherstellung');
  fs.mkdirSync(safety, { recursive: true });
  fs.copyFileSync(files.data, path.join(safety, `lehrerpult-${Date.now()}.dat`));
  vault.write(data);
  return { ok: true, data };
});

handle('backups:choose-extra-dir', async () => {
  const res = await dialog.showOpenDialog(win, { title: 'Zusätzlichen Sicherungsordner wählen', properties: ['openDirectory', 'createDirectory'] });
  if (res.canceled) return { ok: false };
  config.extraBackupDir = res.filePaths[0];
  saveConfig();
  return { ok: true, config };
});

handle('folders:open', (which) => shell.openPath(which === 'data' ? path.dirname(files.data) : files.backups));

handle('app:ready-to-close', () => {
  closeConfirmed = true;
  if (vault.unlocked) runBackup();
  win?.close();
  return { ok: true };
});

// ---------- Fenster ----------
function createWindow() {
  win = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1000,
    minHeight: 660,
    title: 'Lehrerpult',
    backgroundColor: '#f7f7f5',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
    },
  });
  win.once('ready-to-show', () => win.show());

  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  // Externe Links im Standardbrowser öffnen, nie im App-Fenster.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e) => e.preventDefault());

  // Vor dem Schließen: ungespeicherte Änderungen sichern lassen, dann Sicherung anlegen.
  win.on('close', (e) => {
    if (closeConfirmed || !vault.unlocked) return;
    e.preventDefault();
    win.webContents.send('app:flush-and-close');
    setTimeout(() => {
      if (!closeConfirmed) {
        closeConfirmed = true;
        runBackup();
        win?.close();
      }
    }, 4000);
  });
  win.on('closed', () => (win = null));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  // Mikrofon (Lautstärkemesser) und Vollbild erlauben, sonst nichts.
  const allowed = new Set(['media', 'fullscreen', 'clipboard-sanitized-write']);
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(allowed.has(permission)));
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowed.has(permission));
  createWindow();

  // Laptop gesperrt → App sperren.
  powerMonitor.on('lock-screen', () => {
    if (!vault.unlocked) return;
    win?.webContents.send('app:lock-now');
    setTimeout(() => vault.lock(), 3000);
  });
});

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('window-all-closed', () => app.quit());
