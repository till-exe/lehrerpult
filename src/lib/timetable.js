import { app } from './store.svelte.js';
import { uid } from './classes.js';
import { weekday, today, addDays } from './dates.js';
import { freeDay } from './holidays.js';

export const DEFAULT_PERIODS = [
  { start: '07:45', end: '08:30' },
  { start: '08:30', end: '09:15' },
  { start: '09:35', end: '10:20' },
  { start: '10:20', end: '11:05' },
  { start: '11:20', end: '12:05' },
  { start: '12:05', end: '12:50' },
  { start: '13:00', end: '13:45' },
  { start: '13:45', end: '14:30' },
  { start: '14:30', end: '15:15' },
  { start: '15:15', end: '16:00' },
];

export const periods = () => app.data.settings.periods ?? DEFAULT_PERIODS;

export function timeRange(period, length = 1) {
  const p = periods();
  const a = p[period - 1];
  const b = p[period + length - 2] ?? a;
  return a ? `${a.start}–${b.end}` : '';
}

export const periodLabel = (period, length = 1) => (length > 1 ? `${period}.–${period + length - 1}. Std.` : `${period}. Std.`);

export const classOf = (id) => app.data.classes.find((c) => c.id === id) ?? null;

// Name einer Stunde: Klasse oder freier Titel (z. B. Aufsicht).
export function lessonName(l) {
  return classOf(l.classId)?.name ?? l.title ?? 'Stunde';
}

export function entriesFor(day) {
  return app.data.timetable.filter((e) => e.day === day).sort((a, b) => a.period - b.period);
}

// Belegt eine Stunde den Platz schon? (ignoreId: der Eintrag, der gerade bearbeitet wird)
export function overlaps(entry, ignoreId) {
  return app.data.timetable.some(
    (e) => e.id !== ignoreId && e.day === entry.day && e.period < entry.period + entry.length && entry.period < e.period + e.length,
  );
}

export function saveEntry(entry) {
  planChange(() => {
    const i = app.data.timetable.findIndex((e) => e.id === entry.id);
    if (i >= 0) app.data.timetable[i] = entry;
    else app.data.timetable.push({ ...entry, id: uid() });
  });
}

export function deleteEntry(id) {
  planChange(() => (app.data.timetable = app.data.timetable.filter((e) => e.id !== id)));
}

// ---------- Varianten des Stundenplans (z. B. für den FOS-Blockwechsel) ----------

export const activePlan = () => app.data.plans.find((p) => p.id === app.data.settings.planId) ?? app.data.plans[0];

export function switchPlan(id) {
  const from = activePlan();
  const to = app.data.plans.find((p) => p.id === id);
  if (!to || to === from) return;
  planChange(() => {
    from.entries = app.data.timetable;
    app.data.timetable = to.entries ?? [];
    to.entries = null;
    app.data.settings.planId = to.id;
  });
}

// Neue Variante als Kopie des aktuellen Plans.
export function addPlan(name) {
  const copy = JSON.parse(JSON.stringify(app.data.timetable)).map((e) => ({ ...e, id: uid() }));
  const plan = { id: uid(), name, entries: copy };
  app.data.plans.push(plan);
  switchPlan(plan.id);
}

export function deletePlan(id) {
  if (app.data.plans.length < 2) return;
  if (id === activePlan().id) switchPlan(app.data.plans.find((p) => p.id !== id).id);
  app.data.plans = app.data.plans.filter((p) => p.id !== id);
}

// ---------- Tage ----------
// Ein Tag ohne eigene Einträge zeigt den aktuellen Stundenplan.
// Sobald an einem Tag etwas notiert oder geändert wird, werden seine Stunden für diesen Tag festgehalten.

export const lessonKey = (l) => l.entryId ?? l.id;

function fromTimetable(date) {
  return entriesFor(weekday(date)).map((e) => ({
    id: uid(),
    entryId: e.id,
    period: e.period,
    length: e.length,
    classId: e.classId,
    title: classOf(e.classId)?.name ?? e.title,
    subject: e.subject,
    room: e.room,
    note: '',
    todos: [],
  }));
}

const hasText = (l) => !!l.note?.trim() || l.todos.length > 0;
const dateBound = (l) => !!(l.extra || l.changed || l.cancelled); // gilt nur für genau diesen Tag
const hasContent = (l) => hasText(l) || dateBound(l);
const byPeriod = (a, b) => a.period - b.period;

export function lessonsFor(date) {
  const day = app.data.days[date];
  const free = !!freeDay(date);
  if (!day) return free ? [] : fromTimetable(date);
  return (free ? day.lessons.filter(hasContent) : [...day.lessons]).sort(byPeriod);
}

function freeze(date) {
  if (!app.data.days[date]) app.data.days[date] = { lessons: freeDay(date) ? [] : fromTimetable(date) };
  return app.data.days[date];
}

// Künftige Tage ohne Inhalt wieder freigeben, damit sie dem Stundenplan folgen.
function tidy(date) {
  const day = app.data.days[date];
  if (day && date >= today() && !day.lessons.some(hasContent)) delete app.data.days[date];
}

const find = (date, key) => freeze(date).lessons.find((l) => lessonKey(l) === key);

export function setNote(date, key, text) {
  find(date, key).note = text;
  tidy(date);
}

export function addTodo(date, key, text) {
  find(date, key).todos.push({ id: uid(), text: text.trim(), done: false });
}

export function toggleTodo(date, key, todoId) {
  const t = find(date, key).todos.find((x) => x.id === todoId);
  t.done = !t.done;
}

export function removeTodo(date, key, todoId) {
  const l = find(date, key);
  l.todos = l.todos.filter((x) => x.id !== todoId);
  tidy(date);
}

export function setCancelled(date, key, cancelled) {
  find(date, key).cancelled = cancelled;
  tidy(date);
}

// Änderung nur für diesen Tag (Raum, Stunde, Vertretungsklasse …).
export function updateDayLesson(date, key, patch) {
  const l = find(date, key);
  const fields = ['period', 'length', 'classId', 'title', 'subject', 'room'];
  if (!l.extra && fields.some((f) => f in patch && patch[f] !== l[f])) l.changed = true;
  Object.assign(l, patch);
  tidy(date);
}

// Zusätzliche Stunde nur an diesem Tag, z. B. eine Vertretung.
export function addDayLesson(date, lesson) {
  freeze(date).lessons.push({ id: uid(), extra: true, note: '', todos: [], ...lesson });
}

export function removeDayLesson(date, key) {
  const day = freeze(date);
  day.lessons = day.lessons.filter((l) => lessonKey(l) !== key);
  tidy(date);
}

// Nicht erledigte To-dos aus vergangenen Tagen.
export function openFromEarlier() {
  const now = today();
  const out = [];
  for (const [date, day] of Object.entries(app.data.days)) {
    if (date >= now) continue;
    for (const l of day.lessons) for (const t of l.todos) if (!t.done) out.push({ date, key: lessonKey(l), lesson: l, todo: t });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- Verlauf und Planung einer Klasse ----------

// Alle Stunden einer Klasse zwischen zwei Daten (einschließlich).
export function classLessons(classId, from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) for (const l of lessonsFor(d)) if (l.classId === classId) out.push({ date: d, lesson: l });
  return out;
}

// Letzte gehaltene Stunde der Klasse mit Eintrag, vor der angegebenen Stunde.
export function previousLesson(classId, date, period) {
  let best = null;
  for (const [d, day] of Object.entries(app.data.days)) {
    if (d > date) continue;
    for (const l of day.lessons) {
      if (l.classId !== classId || l.cancelled || !l.note?.trim()) continue;
      if (d === date && l.period >= period) continue;
      if (!best || d > best.date || (d === best.date && l.period > best.lesson.period)) best = { date: d, lesson: l };
    }
  }
  return best;
}

// ---------- Planänderungen ----------
// Ändert sich der Stundenplan (Eintrag, Variante, Ferien), wandern geplante Themen und To-dos mit:
// was für die n-te kommende Stunde einer Klasse geplant war, bleibt bei der n-ten Stunde.
// Heute und die Vergangenheit bleiben unverändert.

const seqKey = (l) => l.classId || `titel:${l.title}`;

function capturePlanned() {
  const t = today();
  const dates = Object.keys(app.data.days).filter((d) => d > t).sort();
  const items = [];
  if (!dates.length) return items;
  const count = {};
  for (let d = addDays(t, 1); d <= dates.at(-1); d = addDays(d, 1)) {
    for (const l of lessonsFor(d)) {
      if (dateBound(l)) continue;
      const k = seqKey(l);
      count[k] = (count[k] ?? 0) + 1;
      if (hasText(l)) items.push({ k, n: count[k], date: d, lesson: l });
    }
  }
  return JSON.parse(JSON.stringify(items));
}

function replan(items) {
  const t = today();
  // 1. Künftige Tage neu aus dem Stundenplan aufbauen; nur Tagesbezogenes bleibt stehen.
  for (const date of Object.keys(app.data.days).filter((d) => d > t)) {
    const bound = app.data.days[date].lessons.filter(dateBound);
    if (!bound.length) {
      delete app.data.days[date];
      continue;
    }
    const fresh = freeDay(date) ? [] : fromTimetable(date);
    const kept = [];
    for (const b of bound) {
      if (b.extra) {
        kept.push(b);
        continue;
      }
      const i = fresh.findIndex((f) => f.entryId === b.entryId);
      const j = i >= 0 ? i : fresh.findIndex((f) => seqKey(f) === seqKey(b));
      if (j >= 0) {
        b.entryId = fresh[j].entryId;
        fresh.splice(j, 1);
        kept.push(b);
      } else if (b.changed) kept.push({ ...b, extra: true });
    }
    app.data.days[date] = { lessons: [...kept, ...fresh] };
    tidy(date);
  }
  if (!items.length) return;
  // 2. Geplantes auf die n-te Stunde der Klasse im neuen Plan legen.
  const open = new Map(items.map((it) => [`${it.k}#${it.n}`, it]));
  const count = {};
  for (let d = addDays(t, 1), i = 0; open.size && i < 500; d = addDays(d, 1), i++) {
    for (const l of lessonsFor(d)) {
      if (dateBound(l)) continue;
      const k = seqKey(l);
      count[k] = (count[k] ?? 0) + 1;
      const it = open.get(`${k}#${count[k]}`);
      if (!it) continue;
      const target = find(d, lessonKey(l));
      target.note = it.lesson.note;
      target.todos = it.lesson.todos;
      open.delete(`${k}#${count[k]}`);
    }
  }
  // 3. Was keinen Platz mehr findet (Klasse hat keine Stunden mehr), bleibt am alten Tag sichtbar.
  for (const it of open.values()) {
    if (it.lesson.classId && !classOf(it.lesson.classId)) continue;
    freeze(it.date).lessons.push({ ...it.lesson, id: uid(), entryId: undefined, extra: true, orphan: true });
  }
}

export function planChange(fn) {
  const items = capturePlanned();
  fn();
  replan(items);
}

export function saveHolidays(list) {
  planChange(() => (app.data.holidays = list));
}
