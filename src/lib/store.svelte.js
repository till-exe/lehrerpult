import { api } from './api.js';

export const SCHEMA = 1;

export function emptyData() {
  return {
    schema: SCHEMA,
    settings: { startPage: 'start' },
    classes: [],
    students: [],
    timetable: [],
    days: {},
    todos: [],
    oral: [],
    exams: [],
    lists: [],
    notes: [],
  };
}

// Ältere oder unvollständige Daten auf den aktuellen Stand bringen.
function migrate(data) {
  const base = emptyData();
  return { ...base, ...data, settings: { ...base.settings, ...(data?.settings ?? {}) }, schema: SCHEMA };
}

export const app = $state({
  phase: 'loading', // loading | setup | locked | ready
  data: null,
  config: null,
  page: 'start',
  version: '',
  saveState: 'saved', // saved | pending | error
  saveError: '',
});

let lastSaved = '';
let timer = null;

export function load(data) {
  app.data = migrate(data);
  lastSaved = JSON.stringify(app.data);
  app.page = app.data.settings.startPage ?? 'start';
  app.phase = 'ready';
}

// Wird bei jeder Änderung aufgerufen; speichert kurz verzögert.
export function changed(json) {
  if (json === lastSaved) return;
  app.saveState = 'pending';
  clearTimeout(timer);
  timer = setTimeout(() => flush(), 400);
}

export async function flush() {
  clearTimeout(timer);
  if (!app.data) return;
  const json = JSON.stringify($state.snapshot(app.data));
  if (json === lastSaved) {
    app.saveState = 'saved';
    return;
  }
  const res = await api.save(JSON.parse(json));
  if (res.ok) {
    lastSaved = json;
    app.saveState = 'saved';
    app.saveError = '';
  } else {
    app.saveState = 'error';
    app.saveError = res.error ?? 'Unbekannter Fehler';
  }
}

export async function lockApp() {
  await flush();
  await api.lock();
  app.data = null;
  lastSaved = '';
  app.phase = 'locked';
}
