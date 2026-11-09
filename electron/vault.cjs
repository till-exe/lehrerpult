// Verschlüsselte Datendatei.
// Ein zufälliger Datenschlüssel verschlüsselt die Daten (AES-256-GCM).
// Dieser Schlüssel wird zweimal "eingepackt": mit dem Passwort und mit dem Wiederherstellungscode.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function deriveKey(secret, salt) {
  return crypto.scryptSync(secret.normalize('NFC'), salt, 32, SCRYPT);
}

function seal(key, plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(plain), c.final()]);
  return { iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), ct: ct.toString('base64') };
}

function open(key, box) {
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(box.iv, 'base64'));
  d.setAuthTag(Buffer.from(box.tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(box.ct, 'base64')), d.final()]);
}

function wrap(secret, dek) {
  const salt = crypto.randomBytes(16);
  return { salt: salt.toString('base64'), ...seal(deriveKey(secret, salt), dek) };
}

function unwrap(secret, w) {
  try {
    return open(deriveKey(secret, Buffer.from(w.salt, 'base64')), w);
  } catch {
    return null;
  }
}

function normalizeCode(code) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function newRecoveryCode() {
  const bytes = crypto.randomBytes(24);
  let s = '';
  for (const b of bytes) s += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return s.match(/.{4}/g).join('-');
}

function writeAtomic(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  const fd = fs.openSync(tmp, 'w');
  fs.writeSync(fd, text);
  fs.fsyncSync(fd);
  fs.closeSync(fd);
  if (fs.existsSync(file)) fs.copyFileSync(file, file + '.vorher');
  fs.renameSync(tmp, file);
}

class Vault {
  constructor(file) {
    this.file = file;
    this.dek = null;
    this.env = null;
  }

  exists() {
    return fs.existsSync(this.file);
  }

  get unlocked() {
    return this.dek !== null;
  }

  readEnvelope(file = this.file) {
    const env = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (env.format !== 'lehrerpult' || env.version !== 1) throw new Error('Unbekanntes Dateiformat');
    return env;
  }

  create(password, data) {
    const dek = crypto.randomBytes(32);
    const code = newRecoveryCode();
    this.env = {
      format: 'lehrerpult',
      version: 1,
      wrapPassword: wrap(password, dek),
      wrapRecovery: wrap(normalizeCode(code), dek),
      data: null,
    };
    this.dek = dek;
    this.write(data);
    return code;
  }

  unlockWithPassword(password) {
    const env = this.readEnvelope();
    const dek = unwrap(password, env.wrapPassword);
    if (!dek) return false;
    this.env = env;
    this.dek = dek;
    return true;
  }

  unlockWithKey(dek) {
    const env = this.readEnvelope();
    try {
      open(dek, env.data);
    } catch {
      return false;
    }
    this.env = env;
    this.dek = dek;
    return true;
  }

  // Passwort vergessen: mit dem Code entsperren und ein neues Passwort setzen.
  resetWithRecovery(code, newPassword) {
    const env = this.readEnvelope();
    const dek = unwrap(normalizeCode(code), env.wrapRecovery);
    if (!dek) return false;
    this.env = env;
    this.dek = dek;
    this.env.wrapPassword = wrap(newPassword, dek);
    writeAtomic(this.file, JSON.stringify(this.env));
    return true;
  }

  changePassword(oldPassword, newPassword) {
    if (!unwrap(oldPassword, this.env.wrapPassword)) return false;
    this.env.wrapPassword = wrap(newPassword, this.dek);
    writeAtomic(this.file, JSON.stringify(this.env));
    return true;
  }

  newRecoveryCode() {
    const code = newRecoveryCode();
    this.env.wrapRecovery = wrap(normalizeCode(code), this.dek);
    writeAtomic(this.file, JSON.stringify(this.env));
    return code;
  }

  read() {
    return JSON.parse(open(this.dek, this.env.data).toString('utf8'));
  }

  // Liest die Daten einer Sicherung (gleicher Datenschlüssel, auch nach Passwortwechsel).
  readBackup(file) {
    const env = this.readEnvelope(file);
    return JSON.parse(open(this.dek, env.data).toString('utf8'));
  }

  write(data) {
    if (!this.dek) throw new Error('Gesperrt');
    this.env.data = seal(this.dek, Buffer.from(JSON.stringify(data), 'utf8'));
    writeAtomic(this.file, JSON.stringify(this.env));
  }

  lock() {
    if (this.dek) this.dek.fill(0);
    this.dek = null;
    this.env = null;
  }
}

module.exports = { Vault, writeAtomic };
