<script>
  import Modal from './Modal.svelte';
  import { saveEvent, deleteEvent } from '../lib/exams.js';
  import { today } from '../lib/dates.js';

  let { event = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let e = $state({ title: '', date: today(), time: '', note: '', ...(event ?? {}) });
  let error = $state('');

  function save() {
    if (!e.title.trim()) return (error = 'Bitte einen Titel eingeben.');
    if (!e.date) return (error = 'Bitte ein Datum wählen.');
    saveEvent({ ...$state.snapshot(e), title: e.title.trim() });
    onclose();
  }
  const autofocus = (node) => node.focus();
</script>

<Modal title={event?.id ? 'Termin bearbeiten' : 'Neuer Termin'} {onclose}>
  <form id="event-form" onsubmit={(ev) => (ev.preventDefault(), save())}>
    <label class="field">Titel<input type="text" bind:value={e.title} use:autofocus /></label>
    <div class="row">
      <label class="field">Datum<input type="date" bind:value={e.date} /></label>
      <label class="field">Uhrzeit (optional)<input type="time" bind:value={e.time} /></label>
    </div>
    <label class="field">Notiz<input type="text" bind:value={e.note} /></label>
    {#if error}<p class="error">{error}</p>{/if}
  </form>
  {#snippet actions()}
    {#if event?.id}<button class="btn danger left" onclick={() => (deleteEvent(event.id), onclose())}>Löschen</button>{/if}
    <button class="btn ghost" onclick={onclose}>Abbrechen</button>
    <button class="btn primary" type="submit" form="event-form">Speichern</button>
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
  input[type='date'],
  input[type='time'] {
    font: inherit;
    padding: 0.5rem 0.6rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
  }
  .left {
    margin-right: auto;
  }
</style>
