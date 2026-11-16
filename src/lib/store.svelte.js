import { api } from './api.js';
import { BAVARIA_2026_27 } from './holidays.js';

export const SCHEMA = 2;
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function emptyData() {
  return {
    schema: SCHEMA,
    settings: { startPage: 'start', classId: null, planId: 'a' },
    classes: [],
    students: [],
    timetable: [], // Einträge der aktiven Stundenplan-Variante
    plans: [{ id: 'a', name: 'Plan A', entries: null }], // entries nur bei nicht aktiven Varianten
    holidays: BAVARIA_2026_27.map((h) => ({ id: newId(), ...h })),
    days: {},
    todos: [],
    oral: [],
    forgot: [],
    exams: [],
    lists: [],
    seatplans: [],
    wheels: [],
    notes: [],
  };
}

// Ältere oder unvollständige Daten auf den aktuellen Stand bringen.
function migrate(data) {
  const base = emptyData();
  const d = { ...base, ...data, settings: { ...base.settings, ...(data?.settings ?? {}) }, schema: SCHEMA };
  // Bis 0.5: ein Sitzplan je Klasse unter "seating"
  for (const [classId, p] of Object.entries(d.seating ?? {}))
    d.seatplans.push({ id: newId(), classId, name: 'Sitzplan', rows: p.rows, cols: p.cols, seats: p.seats ?? {}, blocked: {} });
  delete d.seating;
  return d;
}

export const app = $state({
  phase: 'loading', // loading | setup | locked | ready
  data: null,
  config: null,
  page: 'start',
  navKey: 0, // erhöht sich bei einem Sprung aus der Suche, damit die Seite neu aufgebaut wird
  jump: null, // Sprungziel aus der Suche: { date } | { noteId } | { studentId }
  version: '',
  saveState: 'saved', // saved | pending | error
  saveError: '',
  undoCount: 0,
});

let lastSaved = '';
let timer = null;

// ---------- Rückgängig ----------
let undoStack = [];
let seenJson = '';
let seenKey = '';
let lastChange = 0;
let lastField = null;
let restoring = false;

// Die gewählte Klasse ist keine inhaltliche Änderung.
function contentKey(json) {
  const d = JSON.parse(json);
  d.settings = { ...d.settings, classId: null };
  return JSON.stringify(d);
}

function resetHistory(json) {
  undoStack = [];
  seenJson = json;
  seenKey = json ? contentKey(json) : '';
  app.undoCount = 0;
}

export function undo() {
  if (!undoStack.length) return;
  const classId = app.data.settings.classId;
  restoring = true;
  app.data = JSON.parse(undoStack.pop());
  if (app.data.classes.some((c) => c.id === classId)) app.data.settings.classId = classId;
  app.undoCount = undoStack.length;
}

export function load(data) {
  app.data = migrate(data);
  lastSaved = JSON.stringify(data);
  resetHistory(JSON.stringify(app.data));
  app.page = app.data.settings.startPage ?? 'start';
  app.phase = 'ready';
}

// Wird bei jeder Änderung aufgerufen; speichert kurz verzögert.
export function changed(json) {
  if (json !== seenJson) {
    const key = contentKey(json);
    if (restoring) restoring = false;
    else if (key !== seenKey) {
      // Fortlaufendes Tippen im selben Feld zählt als ein Schritt.
      const now = Date.now();
      const el = document.activeElement;
      const typing = !!el?.matches?.('textarea, input:not([type=checkbox]):not([type=radio])') && el === lastField && now - lastChange < 1500;
      if (!typing) {
        undoStack.push(seenJson);
        if (undoStack.length > 50) undoStack.shift();
        app.undoCount = undoStack.length;
      }
      lastChange = now;
      lastField = el;
    }
    seenJson = json;
    seenKey = key;
  }
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
  resetHistory('');
  app.phase = 'locked';
}
