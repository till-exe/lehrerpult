import { app } from './store.svelte.js';
import { uid } from './classes.js';
import { today, addDays } from './dates.js';

export const EXAM_TYPES = ['Schulaufgabe', 'Kurzarbeit', 'Ex', 'Test', 'Referat', 'Sonstiges'];

const byDate = (a, b) => a.date.localeCompare(b.date);

export const examsOn = (date, classId) => app.data.exams.filter((x) => x.date === date && (!classId || x.classId === classId));

// Eigene Termine (Konferenz, Elternabend …)
export const eventsOn = (date) => app.data.events.filter((e) => e.date === date).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

export function upcomingEvents(days) {
  const from = today();
  const to = addDays(from, days);
  return app.data.events.filter((e) => e.date >= from && e.date <= to);
}

export function saveEvent(event) {
  const i = app.data.events.findIndex((e) => e.id === event.id);
  if (i >= 0) app.data.events[i] = event;
  else app.data.events.push({ ...event, id: uid() });
}

export function deleteEvent(id) {
  app.data.events = app.data.events.filter((e) => e.id !== id);
}

export function upcomingExams(days = null) {
  const from = today();
  const to = days === null ? '9999-12-31' : addDays(from, days);
  return app.data.exams.filter((x) => x.date >= from && x.date <= to).sort(byDate);
}

export function pastExams() {
  return app.data.exams.filter((x) => x.date < today()).sort(byDate).reverse();
}

export function saveExam(exam) {
  const i = app.data.exams.findIndex((x) => x.id === exam.id);
  if (i >= 0) app.data.exams[i] = exam;
  else app.data.exams.push({ ...exam, id: uid() });
}

export function deleteExam(id) {
  app.data.exams = app.data.exams.filter((x) => x.id !== id);
}

// ---------- Notenschlüssel ----------
// percents: Mindestprozent für die Noten 1 bis 5; alles darunter ist 6.
export const KEY_PRESETS = [
  { name: 'IHK-Schlüssel', percents: [92, 81, 67, 50, 30] },
  { name: '85 / 70 / 55 / 40 / 20', percents: [85, 70, 55, 40, 20] },
  { name: '87,5 / 75 / 62,5 / 50 / 30', percents: [87.5, 75, 62.5, 50, 30] },
];

export function gradeKey(total, percents, step = 0.5) {
  const roundUp = (x) => Math.ceil(x / step - 1e-9) * step;
  const mins = percents.map((p) => Math.min(total, roundUp((total * p) / 100)));
  const rows = [];
  for (let g = 1; g <= 6; g++) {
    const from = g <= 5 ? mins[g - 1] : 0;
    const to = g === 1 ? total : mins[g - 2] - step;
    rows.push({ grade: g, from, to: Math.max(from, to), empty: to < from });
  }
  return rows;
}

export function gradeFor(points, total, percents, step = 0.5) {
  const row = gradeKey(total, percents, step).find((r) => !r.empty && points >= r.from);
  return row?.grade ?? 6;
}
