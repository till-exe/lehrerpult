<script>
  import Modal from './Modal.svelte';
  import { sortedClasses } from '../lib/classes.js';
  import { fmtLong } from '../lib/dates.js';
  import { periods, classOf, lessonKey, addDayLesson, updateDayLesson, removeDayLesson } from '../lib/timetable.js';

  // lesson = null → zusätzliche Stunde nur für diesen Tag
  let { date, lesson = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let e = $state({ period: 1, length: 1, classId: '', title: '', subject: '', room: '', cancelled: false, ...(lesson ?? {}) });
  // svelte-ignore state_referenced_locally
  if (e.classId) e.title = '';
  let error = $state('');

  function save() {
    if (!e.classId && !e.title.trim()) return (error = 'Bitte eine Klasse wählen oder einen Titel eingeben.');
    const fields = {
      period: e.period,
      length: e.length,
      classId: e.classId,
      title: e.classId ? classOf(e.classId).name : e.title.trim(),
      subject: e.subject,
      room: e.room,
      cancelled: e.cancelled,
    };
    if (lesson) updateDayLesson(date, lessonKey(lesson), fields);
    else addDayLesson(date, fields);
    onclose();
  }
</script>

<Modal title={lesson ? 'Stunde an diesem Tag ändern' : 'Zusätzliche Stunde'} {onclose}>
  <p class="muted small">Gilt nur für {fmtLong(date)}. Der Stundenplan bleibt unverändert.</p>
  <form id="day-form" onsubmit={(ev) => (ev.preventDefault(), save())}>
    <div class="row">
      <label class="field">Stunde
        <select bind:value={e.period}>
          {#each periods() as p, i}<option value={i + 1}>{i + 1}. ({p.start})</option>{/each}
        </select>
      </label>
      <label class="field">Dauer
        <select bind:value={e.length}>
          <option value={1}>Einzelstunde</option>
          <option value={2}>Doppelstunde</option>
        </select>
      </label>
    </div>
    <label class="field">Klasse
      <select bind:value={e.classId}>
        <option value="">– keine Klasse –</option>
        {#each sortedClasses() as c}<option value={c.id}>{c.name}</option>{/each}
      </select>
    </label>
    {#if !e.classId}
      <label class="field">Titel<input type="text" bind:value={e.title} /></label>
    {/if}
    <div class="row">
      <label class="field">Fach<input type="text" bind:value={e.subject} /></label>
      <label class="field">Raum<input type="text" bind:value={e.room} /></label>
    </div>
    {#if lesson}
      <label class="check"><input type="checkbox" bind:checked={e.cancelled} /> Stunde entfällt</label>
    {/if}
    {#if error}<p class="error">{error}</p>{/if}
  </form>
  {#snippet actions()}
    {#if lesson?.extra}<button class="btn danger left" onclick={() => (removeDayLesson(date, lessonKey(lesson)), onclose())}>Entfernen</button>{/if}
    <button class="btn ghost" onclick={onclose}>Abbrechen</button>
    <button class="btn primary" type="submit" form="day-form">Speichern</button>
  {/snippet}
</Modal>

<style>
  form {
    display: grid;
    gap: 0.9rem;
  }
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }
  .check {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .left {
    margin-right: auto;
  }
</style>
