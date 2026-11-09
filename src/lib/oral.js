import { app } from './store.svelte.js';
import { uid } from './classes.js';
import { today } from './dates.js';

export const KINDS = [
  { id: 'RA', label: 'RA', hint: 'Rechenschaftsablage' },
  { id: 'RF', label: 'RF', hint: 'Referat' },
  { id: 'UB', label: 'UB', hint: 'Unterrichtsbeitrag' },
  { id: 'Frei', label: 'Freitext', hint: 'Eigene Bezeichnung' },
];

export const entriesOfClass = (classId) => app.data.oral.filter((o) => o.classId === classId);

export const entriesOf = (studentId) =>
  app.data.oral.filter((o) => o.studentId === studentId).sort((a, b) => a.date.localeCompare(b.date));

export function entryLabel(o) {
  const kind = o.kind === 'Frei' ? o.label || 'Notiz' : o.kind;
  return [kind, o.grade, o.mark].filter(Boolean).join(' ');
}

export function quickMark(student, mark) {
  app.data.oral.push({ id: uid(), classId: student.classId, studentId: student.id, date: today(), kind: 'UB', label: '', grade: null, mark, note: '', transferred: false });
}

export function saveOral(entry) {
  const i = app.data.oral.findIndex((o) => o.id === entry.id);
  if (i >= 0) app.data.oral[i] = entry;
  else app.data.oral.push({ ...entry, id: uid() });
}

export function deleteOral(id) {
  app.data.oral = app.data.oral.filter((o) => o.id !== id);
}

export function markAllTransferred(classId) {
  for (const o of app.data.oral) if (o.classId === classId) o.transferred = true;
}
