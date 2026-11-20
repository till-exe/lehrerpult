// Brücke zur Windows-App. Im normalen Browser (nur zum Entwickeln) gibt es eine Attrappe ohne echte Speicherung.
function mockApi() {
  const mode = new URLSearchParams(location.search).get('mock') ?? 'app';
  let exists = mode !== 'setup';
  let data = null;
  let config = { lockMode: 'sperre', idleMinutes: 0, extraBackupDir: null };
  const ok = (x = {}) => Promise.resolve({ ok: true, ...x });
  const items = [
    { kind: 'taeglich', name: 'lehrerpult-2026-11-09.dat', path: 'a', size: 18200, modified: '2026-11-09T19:02:00Z' },
    { kind: 'monatlich', name: 'lehrerpult-2026-11.dat', path: 'b', size: 18200, modified: '2026-11-09T19:02:00Z' },
    { kind: 'taeglich', name: 'lehrerpult-2026-11-08.dat', path: 'c', size: 17900, modified: '2026-11-08T17:40:00Z' },
  ];
  return {
    mock: true,
    status: () => Promise.resolve({ exists, unlocked: false, config, version: 'Vorschau' }),
    autoUnlock: () => (mode === 'app' ? ok({ data }) : Promise.resolve({ ok: false })),
    setup: (_pw, d) => ((exists = true), (data = d), ok({ recoveryCode: 'K7QM-2XPA-9RTD-HW4E-NB6S-3FJC' })),
    importFile: () => ok(),
    unlock: (pw) => (pw === 'falsch' ? Promise.resolve({ ok: false, error: 'Das Passwort stimmt nicht.' }) : ok({ data })),
    recover: () => ok({ data }),
    save: (d) => ((data = d), ok()),
    lock: () => ok(),
    changePassword: () => ok(),
    newRecoveryCode: () => ok({ recoveryCode: 'P3LX-8QWE-MN2D-RT7K-ZC4H-9YVB' }),
    setConfig: (p) => ((config = { ...config, ...p }), ok({ config })),
    listBackups: () => ok({ items, folder: 'C:\\Users\\Till\\AppData\\Roaming\\Lehrerpult\\sicherungen' }),
    backupNow: () => ok(),
    restoreBackup: () => ok({ data }),
    archive: () => ok(),
    chooseExtraBackupDir: () => ((config = { ...config, extraBackupDir: 'E:\\Lehrerpult-Sicherung' }), ok({ config })),
    openFolder: () => ok(),
    readyToClose: () => ok(),
    keepAwake: () => ok(),
    checkUpdate: () => ok({ current: 'Vorschau', latest: '0.8.0', available: true }),
    downloadUpdate: () => new Promise((r) => setTimeout(() => r({ ok: true }), 800)),
    installUpdate: () => ok(),
    onUpdateProgress: () => () => {},
    onLockNow: () => () => {},
    onFlushAndClose: () => () => {},
  };
}

export const api = window.lehrerpult ?? mockApi();
