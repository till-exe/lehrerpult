<script>
  import Modal from './Modal.svelte';
  import { app } from '../lib/store.svelte.js';
  import { periods, DEFAULT_PERIODS } from '../lib/timetable.js';

  let { onclose } = $props();
  let list = $state(structuredClone($state.snapshot(periods())));
  let error = $state('');

  function add() {
    const last = list.at(-1);
    list.push({ start: last?.end ?? '08:00', end: last?.end ?? '08:45' });
  }

  function save() {
    if (list.some((p) => !/^\d{2}:\d{2}$/.test(p.start) || !/^\d{2}:\d{2}$/.test(p.end))) return (error = 'Bitte Zeiten im Format 07:45 angeben.');
    app.data.settings.periods = $state.snapshot(list);
    onclose();
  }
</script>

<Modal title="Zeitraster" {onclose}>
  <p class="muted small">Beginn und Ende jeder Unterrichtsstunde.</p>
  <ol>
    {#each list as p, i}
      <li>
        <span class="nr">{i + 1}.</span>
        <input type="time" bind:value={p.start} />
        <span class="muted">bis</span>
        <input type="time" bind:value={p.end} />
      </li>
    {/each}
  </ol>
  <div class="tools">
    <button class="btn ghost" onclick={add}>Stunde anhängen</button>
    <button class="btn ghost" disabled={list.length <= 1} onclick={() => list.pop()}>Letzte entfernen</button>
    <button class="btn ghost" onclick={() => (list = structuredClone(DEFAULT_PERIODS))}>Zurücksetzen</button>
  </div>
  {#if error}<p class="error">{error}</p>{/if}
  {#snippet actions()}
    <button class="btn ghost" onclick={onclose}>Abbrechen</button>
    <button class="btn primary" onclick={save}>Speichern</button>
  {/snippet}
</Modal>

<style>
  ol {
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
    grid-template-columns: 2rem 1fr auto 1fr;
    align-items: center;
    gap: 0.5rem;
  }
  input[type='time'] {
    font: inherit;
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
  }
  .nr {
    color: var(--muted);
    text-align: right;
  }
  .tools {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
  }
</style>
