import { app } from './store.svelte.js';
import { uid } from './classes.js';
import { weekday, today } from './dates.js';

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
  const i = app.data.timetable.findIndex((e) => e.id === entry.id);
  if (i >= 0) app.data.timetable[i] = entry;
  else app.data.timetable.push({ ...entry, id: uid() });
}

export function deleteEntry(id) {
  app.data.timetable = app.data.timetable.filter((e) => e.id !== id);
}

// ---------- Tage ----------
// Ein Tag ohne eigene Einträge zeigt den aktuellen Stundenplan.
// Sobald du an einem Tag etwas notierst, werden seine Stunden für diesen Tag festgehalten,
// damit spätere Änderungen am Stundenplan die Notizen nicht verschieben.

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

export function lessonsFor(date) {
  return app.data.days[date]?.lessons ?? fromTimetable(date);
}

function freeze(date) {
  if (!app.data.days[date]) app.data.days[date] = { lessons: fromTimetable(date) };
  return app.data.days[date];
}

function lessonAt(date, index) {
  return freeze(date).lessons[index];
}

export function setNote(date, index, text) {
  lessonAt(date, index).note = text;
}

export function addTodo(date, index, text) {
  lessonAt(date, index).todos.push({ id: uid(), text: text.trim(), done: false });
}

export function toggleTodo(date, index, todoId) {
  const t = lessonAt(date, index).todos.find((x) => x.id === todoId);
  t.done = !t.done;
}

export function removeTodo(date, index, todoId) {
  const l = lessonAt(date, index);
  l.todos = l.todos.filter((x) => x.id !== todoId);
}

// Nicht erledigte To-dos aus vergangenen Tagen.
export function openFromEarlier() {
  const now = today();
  const out = [];
  for (const [date, day] of Object.entries(app.data.days)) {
    if (date >= now) continue;
    day.lessons.forEach((l, index) => {
      for (const t of l.todos) if (!t.done) out.push({ date, index, lesson: l, todo: t });
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
