import { app } from './store.svelte.js';
import { uid } from './classes.js';
import { today } from './dates.js';

export const FORGOT_KINDS = [
  { id: 'HA', label: 'Hausaufgabe', short: 'HA' },
  { id: 'Mat', label: 'Material', short: 'Material' },
];

export const forgotOf = (studentId, kind) =>
  app.data.forgot.filter((f) => f.studentId === studentId && (!kind || f.kind === kind)).sort((a, b) => b.date.localeCompare(a.date));

export const forgotToday = (studentId, kind) => app.data.forgot.find((f) => f.studentId === studentId && f.kind === kind && f.date === today());

// Heute vermerken; ein zweiter Klick nimmt den heutigen Vermerk zurück.
export function toggleForgot(student, kind) {
  const existing = forgotToday(student.id, kind);
  if (existing) app.data.forgot = app.data.forgot.filter((f) => f.id !== existing.id);
  else app.data.forgot.push({ id: uid(), studentId: student.id, classId: student.classId, kind, date: today() });
}

export function removeForgot(id) {
  app.data.forgot = app.data.forgot.filter((f) => f.id !== id);
}
