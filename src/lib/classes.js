import { app } from './store.svelte.js';
import { byName, sameName } from './names.js';

// Gedeckte Akzentfarben, um Klassen auseinanderzuhalten.
export const COLORS = ['#2e6e61', '#3a6ea5', '#5a5fb0', '#8a4f86', '#b2535f', '#b07a2a', '#6b7d3a', '#5d6b78'];

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const collator = new Intl.Collator('de', { numeric: true });

export function sortedClasses() {
  return [...app.data.classes].sort((a, b) => collator.compare(a.name, b.name));
}

export function currentClass() {
  const { classes, settings } = app.data;
  return classes.find((c) => c.id === settings.classId) ?? sortedClasses()[0] ?? null;
}

export function selectClass(id) {
  app.data.settings.classId = id;
}

export function addClass({ name, subject, color }) {
  const c = { id: uid(), name: name.trim(), subject: subject.trim(), color };
  app.data.classes.push(c);
  selectClass(c.id);
  return c;
}

export function updateClass(id, patch) {
  const c = app.data.classes.find((x) => x.id === id);
  Object.assign(c, { ...patch, name: patch.name.trim(), subject: patch.subject.trim() });
}

export function deleteClass(id) {
  app.data.classes = app.data.classes.filter((c) => c.id !== id);
  app.data.students = app.data.students.filter((s) => s.classId !== id);
  app.data.oral = app.data.oral.filter((o) => o.classId !== id);
  app.data.exams = app.data.exams.filter((x) => x.classId !== id);
  app.data.timetable = app.data.timetable.filter((e) => e.classId !== id);
  app.data.lists = app.data.lists.filter((l) => l.classId !== id);
  delete app.data.seating[id];
  app.data.wheels = app.data.wheels.filter((w) => w.classId !== id);
  for (const n of app.data.notes) if (n.classId === id) n.classId = null;
  if (app.data.settings.classId === id) app.data.settings.classId = sortedClasses()[0]?.id ?? null;
}

export function studentsOf(classId) {
  return app.data.students.filter((s) => s.classId === classId).sort(byName);
}

// Fügt Schüler hinzu und überspringt Namen, die es in der Klasse schon gibt.
export function addStudents(classId, list) {
  const existing = studentsOf(classId);
  let added = 0;
  for (const p of list) {
    const person = { firstName: p.firstName.trim(), lastName: p.lastName.trim() };
    if (existing.some((s) => sameName(s, person))) continue;
    const s = { id: uid(), classId, ...person };
    app.data.students.push(s);
    existing.push(s);
    added++;
  }
  return { added, skipped: list.length - added };
}

export function updateStudent(id, patch) {
  const s = app.data.students.find((x) => x.id === id);
  s.firstName = patch.firstName.trim();
  s.lastName = patch.lastName.trim();
}

export function removeStudent(id) {
  app.data.students = app.data.students.filter((s) => s.id !== id);
  app.data.oral = app.data.oral.filter((o) => o.studentId !== id);
}
