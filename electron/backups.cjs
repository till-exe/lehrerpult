// Automatische Sicherungen: je Tag eine Datei (14 behalten), je Monat eine Datei (12 behalten).
const fs = require('node:fs');
const path = require('node:path');

const KEEP = { taeglich: 14, monatlich: 12 };

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return { day: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, month: `${d.getFullYear()}-${p(d.getMonth() + 1)}` };
}

function prune(dir, keep) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.dat')).sort().reverse();
  for (const f of files.slice(keep)) fs.rmSync(path.join(dir, f), { force: true });
}

function backupTo(source, root) {
  const { day, month } = stamp();
  for (const [kind, name] of [['taeglich', day], ['monatlich', month]]) {
    const dir = path.join(root, kind);
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(source, path.join(dir, `lehrerpult-${name}.dat`));
    prune(dir, KEEP[kind]);
  }
}

// Sichert in alle angegebenen Ordner. Ein nicht erreichbarer Zusatzordner (z. B. USB-Stick) wird gemeldet, nicht abgebrochen.
function backupAll(source, roots) {
  const problems = [];
  for (const root of roots.filter(Boolean)) {
    try {
      backupTo(source, root);
    } catch (e) {
      problems.push({ root, message: e.message });
    }
  }
  return problems;
}

function list(root) {
  const out = [];
  for (const kind of ['taeglich', 'monatlich', 'archiv', 'vor-update']) {
    const dir = path.join(root, kind);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.dat')) continue;
      const full = path.join(dir, f);
      const st = fs.statSync(full);
      out.push({ kind, name: f, path: full, size: st.size, modified: st.mtime.toISOString() });
    }
  }
  return out.sort((a, b) => b.modified.localeCompare(a.modified));
}

// Dauerhafte Kopie, die nie automatisch gelöscht wird (z. B. zum Schuljahresende).
function archive(source, root, label) {
  const dir = path.join(root, 'archiv');
  fs.mkdirSync(dir, { recursive: true });
  const safe = label.replace(/[^\w.-]+/g, '-');
  let file = path.join(dir, `lehrerpult-${safe}.dat`);
  for (let i = 2; fs.existsSync(file); i++) file = path.join(dir, `lehrerpult-${safe}-${i}.dat`);
  fs.copyFileSync(source, file);
  return file;
}

module.exports = { backupAll, list, stamp, archive };
