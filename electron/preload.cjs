const { contextBridge, ipcRenderer } = require('electron');

const call = (name) => (...args) => ipcRenderer.invoke(name, ...args);
const on = (name) => (fn) => {
  const listener = () => fn();
  ipcRenderer.on(name, listener);
  return () => ipcRenderer.removeListener(name, listener);
};

contextBridge.exposeInMainWorld('lehrerpult', {
  status: call('app:status'),
  autoUnlock: call('vault:auto-unlock'),
  setup: call('vault:setup'),
  importFile: call('vault:import'),
  unlock: call('vault:unlock'),
  recover: call('vault:recover'),
  save: call('vault:save'),
  lock: call('vault:lock'),
  changePassword: call('vault:change-password'),
  newRecoveryCode: call('vault:new-recovery-code'),
  setConfig: call('config:set'),
  listBackups: call('backups:list'),
  backupNow: call('backups:now'),
  restoreBackup: call('backups:restore'),
  chooseExtraBackupDir: call('backups:choose-extra-dir'),
  openFolder: call('folders:open'),
  readyToClose: call('app:ready-to-close'),
  onLockNow: on('app:lock-now'),
  onFlushAndClose: on('app:flush-and-close'),
});
