<script>
  import Modal from './Modal.svelte';
  import { app } from '../lib/store.svelte.js';
  import { sortedClasses } from '../lib/classes.js';
  import { WEEKDAYS } from '../lib/dates.js';
  import { periods, overlaps, saveEntry, deleteEntry, classOf } from '../lib/timetable.js';

  let { entry, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let e = $state({ length: 1, classId: '', title: '', subject: '', room: '', ...entry });
  let error = $state('');
  // svelte-ignore state_referenced_locally
  const isNew = !entry.id;

  function pickClass(id) {
    e.classId = id;
    if (id && !e.subject) e.subject = classOf(id)?.subject ?? '';
  }

  function save() {
    if (!e.classId && !e.title.trim()) return (error = 'Bitte eine Klasse wählen oder einen Titel eingeben.');
    if (e.period + e.length - 1 > periods().length) return (error = 'So viele Stunden hat der Tag nicht.');
    if (overlaps(e, e.id)) return (error = 'Zu dieser Zeit steht schon eine Stunde im Plan.');
    saveEntry({ ...$state.snapshot(e), title: e.classId ? '' : e.title.trim() });
    onclose();
  }
</script>

<Modal title={isNew ? 'Stunde eintragen' : 'Stunde bearbeiten'} {onclose}>
  <form id="entry-form" onsubmit={(ev) => (ev.preventDefault(), save())}>
    <div class="row3">
      <label class="field">Tag
        <select bind:value={e.day}>
          {#each WEEKDAYS as d, i}<option value={i + 1}>{d}</option>{/each}
        </select>
      </label>
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
      <select value={e.classId} onchange={(ev) => pickClass(ev.currentTarget.value)}>
        <option value="">– keine Klasse (z. B. Aufsicht) –</option>
        {#each sortedClasses() as c}<option value={c.id}>{c.name}</option>{/each}
      </select>
    </label>
    {#if !e.classId}
      <label class="field">Titel<input type="text" bind:value={e.title} /></label>
    {/if}
    <div class="row2">
      <label class="field">Fach<input type="text" bind:value={e.subject} /></label>
      <label class="field">Raum<input type="text" bind:value={e.room} /></label>
    </div>
    {#if app.data.classes.length === 0}
      <p class="muted small">Tipp: Lege zuerst unter „Klasse“ deine Klassen an, dann kannst du sie hier auswählen.</p>
    {/if}
    {#if error}<p class="error">{error}</p>{/if}
  </form>
  {#snippet actions()}
    {#if !isNew}<button class="btn danger left" onclick={() => (deleteEntry(e.id), onclose())}>Löschen</button>{/if}
    <button class="btn ghost" onclick={onclose}>Abbrechen</button>
    <button class="btn primary" type="submit" form="entry-form">Speichern</button>
  {/snippet}
</Modal>

<style>
  form {
    display: grid;
    gap: 0.9rem;
  }
  .row3 {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1.2fr;
    gap: 0.6rem;
  }
  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }
  .left {
    margin-right: auto;
  }
</style>
