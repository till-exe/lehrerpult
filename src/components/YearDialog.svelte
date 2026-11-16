<script>
  import Modal from './Modal.svelte';
  import { api } from '../lib/api.js';
  import { app, flush } from '../lib/store.svelte.js';
  import { sortedClasses, deleteClass, studentsOf } from '../lib/classes.js';
  import { today } from '../lib/dates.js';

  let { onclose, ondone } = $props();

  let classes = $state(sortedClasses().map((c) => ({ id: c.id, old: c.name, name: c.name, action: 'keep', count: studentsOf(c.id).length })));
  let clear = $state({ oral: true, forgot: true, lists: true, exams: true, events: false, days: true, wheels: true, timetable: false, seatplans: false });
  let error = $state('');
  let busy = $state(false);

  const OPTIONS = [
    ['oral', 'Mündliche Einträge'],
    ['forgot', 'Vermerke zu Hausaufgaben und Material'],
    ['lists', 'Abhak-Listen'],
    ['exams', 'Termine der Leistungsnachweise'],
    ['events', 'Eigene Termine im Kalender'],
    ['days', 'Stundenverlauf (Kurzbeschreibungen und To-dos der Stunden)'],
    ['wheels', 'Streichungen in den Glücksrädern'],
    ['timetable', 'Stundenplan (alle Varianten)'],
    ['seatplans', 'Sitzpläne'],
  ];

  async function run() {
    busy = true;
    error = '';
    await flush();
    const res = await api.archive(`Schuljahresende-${today()}`);
    if (!res.ok) {
      busy = false;
      return (error = `Das Archiv konnte nicht angelegt werden, deshalb wurde nichts geändert. ${res.error ?? ''}`);
    }
    const d = app.data;
    for (const c of classes) {
      if (c.action === 'delete') {
        deleteClass(c.id);
        continue;
      }
      d.classes.find((x) => x.id === c.id).name = c.name.trim() || c.old;
      if (c.action === 'empty') {
        const ids = new Set(studentsOf(c.id).map((s) => s.id));
        d.students = d.students.filter((s) => !ids.has(s.id));
        d.oral = d.oral.filter((o) => !ids.has(o.studentId));
        d.forgot = d.forgot.filter((f) => !ids.has(f.studentId));
      }
    }
    if (clear.oral) d.oral = [];
    if (clear.forgot) d.forgot = [];
    if (clear.lists) d.lists = [];
    if (clear.exams) d.exams = [];
    if (clear.events) d.events = [];
    if (clear.days) d.days = {};
    if (clear.wheels) for (const w of d.wheels) w.struck = {};
    if (clear.seatplans) d.seatplans = [];
    if (clear.timetable) {
      d.timetable = [];
      d.plans = [{ id: 'a', name: 'Plan A', entries: null }];
      d.settings.planId = 'a';
    }
    ondone();
  }
</script>

<Modal title="Neues Schuljahr" {onclose} wide>
  <p class="muted small">Zuerst wird der jetzige Stand als Archiv gesichert. Es bleibt dauerhaft erhalten und lässt sich unter „Sicherungen“ wiederherstellen.</p>

  <h3>Klassen</h3>
  {#if classes.length === 0}<p class="muted small">Keine Klassen vorhanden.</p>{/if}
  <ul>
    {#each classes as c (c.id)}
      <li>
        <input type="text" aria-label="Neuer Name für {c.old}" bind:value={c.name} disabled={c.action === 'delete'} />
        <span class="muted small">{c.count} Schüler</span>
        <select bind:value={c.action}>
          <option value="keep">behalten, Schüler bleiben</option>
          <option value="empty">behalten, Schüler entfernen</option>
          <option value="delete">Klasse löschen</option>
        </select>
      </li>
    {/each}
  </ul>

  <h3>Leeren</h3>
  <div class="options">
    {#each OPTIONS as [key, label]}
      <label><input type="checkbox" bind:checked={clear[key]} /> {label}</label>
    {/each}
  </div>
  <p class="muted small">Notizen, allgemeine To-dos und Einstellungen bleiben immer erhalten. Die Ferien trägst du im Stundenplan unter „Ferien“ neu ein.</p>
  {#if error}<p class="error">{error}</p>{/if}
  {#snippet actions()}
    <button class="btn ghost" onclick={onclose}>Abbrechen</button>
    <button class="btn danger" disabled={busy} onclick={run}>Archivieren und Schuljahr wechseln</button>
  {/snippet}
</Modal>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.4rem;
    max-height: 32vh;
    overflow: auto;
  }
  li {
    display: grid;
    grid-template-columns: 140px 90px 1fr;
    gap: 0.6rem;
    align-items: center;
  }
  li input,
  li select {
    padding: 0.4rem 0.6rem;
  }
  .options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.35rem 1rem;
  }
  .options label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
</style>
