<script>
  import X from '@lucide/svelte/icons/x';
  import Modal from './Modal.svelte';
  import { app } from '../lib/store.svelte.js';
  import { uid } from '../lib/classes.js';
  import { saveHolidays } from '../lib/timetable.js';

  let { onclose } = $props();
  let list = $state(structuredClone($state.snapshot(app.data.holidays)).sort((a, b) => a.from.localeCompare(b.from)));
  let error = $state('');

  function save() {
    const clean = $state.snapshot(list).filter((h) => h.from);
    if (clean.some((h) => h.to && h.to < h.from)) return (error = 'Bei einem Eintrag liegt das Ende vor dem Beginn.');
    saveHolidays(clean.map((h) => ({ ...h, to: h.to || h.from })));
    onclose();
  }
</script>

<Modal title="Ferien und freie Tage" {onclose} wide>
  <p class="muted small">An diesen Tagen zeigt die Startseite keine Stunden. Gesetzliche Feiertage in Bayern und der Buß- und Bettag sind automatisch frei. Für einen einzelnen Tag reicht das erste Datum.</p>
  <ul>
    {#each list as h, i (h.id)}
      <li>
        <input type="text" bind:value={h.name} aria-label="Bezeichnung" />
        <input type="date" bind:value={h.from} aria-label="von" />
        <span class="muted">bis</span>
        <input type="date" bind:value={h.to} aria-label="bis" />
        <button class="btn ghost icon" aria-label="Entfernen" onclick={() => list.splice(i, 1)}><X size={16} /></button>
      </li>
    {/each}
  </ul>
  <button class="btn add" onclick={() => list.push({ id: uid(), name: '', from: '', to: '' })}>Eintrag hinzufügen</button>
  {#if error}<p class="error">{error}</p>{/if}
  {#snippet actions()}
    <button class="btn ghost" onclick={onclose}>Abbrechen</button>
    <button class="btn primary" onclick={save}>Speichern</button>
  {/snippet}
</Modal>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.4rem;
    max-height: 50vh;
    overflow: auto;
  }
  li {
    display: grid;
    grid-template-columns: 1fr auto auto auto auto;
    gap: 0.5rem;
    align-items: center;
  }
  input[type='date'] {
    font: inherit;
    padding: 0.45rem 0.5rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
  }
  .add {
    justify-self: start;
  }
</style>
