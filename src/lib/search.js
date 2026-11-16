import { app } from './store.svelte.js';
import { selectClass } from './classes.js';
import { classOf, lessonName } from './timetable.js';
import { fmtShort } from './dates.js';

function go(page, jump, classId) {
  if (classId) selectClass(classId);
  app.jump = jump ?? null;
  app.page = page;
  app.navKey++;
}

// Sucht in Schülern, Notizen, Stunden, To-dos, Terminen und Listen.
export function search(query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hit = (...texts) => texts.some((t) => t && t.toLowerCase().includes(q));
  const d = app.data;
  const groups = [];
  const add = (title, items) => items.length && groups.push({ title, items: items.slice(0, 6) });

  add(
    'Schüler',
    d.students
      .filter((s) => hit(`${s.firstName} ${s.lastName}`, `${s.lastName} ${s.firstName}`))
      .map((s) => ({ label: `${s.firstName} ${s.lastName}`, sub: classOf(s.classId)?.name, run: () => go('klasse', { studentId: s.id }, s.classId) })),
  );
  add(
    'Notizen',
    d.notes.filter((n) => hit(n.title, n.body)).map((n) => ({ label: n.title || 'Ohne Titel', sub: classOf(n.classId)?.name, run: () => go('notizen', { noteId: n.id }) })),
  );
  const lessons = [];
  for (const [date, day] of Object.entries(d.days))
    for (const l of day.lessons)
      if (hit(l.note, ...l.todos.map((t) => t.text)))
        lessons.push({ date, label: l.todos.find((t) => hit(t.text))?.text ?? l.note, sub: `${fmtShort(date)} · ${lessonName(l)}`, run: () => go('start', { date }) });
  add('Stunden', lessons.sort((a, b) => b.date.localeCompare(a.date)));
  add('To-dos', d.todos.filter((t) => hit(t.text)).map((t) => ({ label: t.text, sub: t.done ? 'erledigt' : 'offen', run: () => go('start') })));
  add(
    'Leistungsnachweise',
    d.exams.filter((x) => hit(x.topic, x.type, x.note)).map((x) => ({ label: `${x.type}${x.topic ? ': ' + x.topic : ''}`, sub: `${fmtShort(x.date)} · ${classOf(x.classId)?.name ?? ''}`, run: () => go('leistungsnachweise') })),
  );
  add('Termine', d.events.filter((e) => hit(e.title, e.note)).map((e) => ({ label: e.title, sub: fmtShort(e.date), run: () => go('start', { date: e.date }) })));
  add('Listen', d.lists.filter((l) => hit(l.name)).map((l) => ({ label: l.name, sub: classOf(l.classId)?.name, run: () => go('klasse', { classTab: 'listen', listId: l.id }, l.classId) })));
  return groups;
}
