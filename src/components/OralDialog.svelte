<script>
  import Modal from './Modal.svelte';
  import { KINDS, saveOral, deleteOral } from '../lib/oral.js';
  import { today } from '../lib/dates.js';

  // entry ohne id → neuer Eintrag
  let { student, entry = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let e = $state({
    classId: student.classId,
    studentId: student.id,
    date: today(),
    kind: 'UB',
    label: '',
    grade: null,
    mark: null,
    note: '',
    transferred: false,
    ...(entry ?? {}),
  });
  let error = $state('');

  const toggle = (field, value) => (e[field] = e[field] === value ? null : value);

  function save() {
    if (!e.grade && !e.mark && !e.note.trim()) return (error = 'Bitte eine Note, + / − oder eine Bemerkung eintragen.');
    saveOral($state.snapshot(e));
    onclose();
  }
</script>

<Modal title="{student.firstName} {student.lastName}" {onclose}>
  <div class="group">
    <span class="lbl">Art</span>
    <div class="seg">
      {#each KINDS as k}
        <button class:on={e.kind === k.id} title={k.hint} onclick={() => (e.kind = k.id)}>{k.label}</button>
      {/each}
    </div>
    {#if e.kind === 'Frei'}
      <input type="text" bind:value={e.label} placeholder="Bezeichnung" />
    {/if}
  </div>

  <div class="group">
    <span class="lbl">Note</span>
    <div class="seg">
      {#each ['1', '2', '3', '4', '5', '6'] as g}
        <button class:on={e.grade === g} onclick={() => toggle('grade', g)}>{g}</button>
      {/each}
    </div>
  </div>

  <div class="group">
    <span class="lbl">Tendenz</span>
    <div class="seg">
      <button class:on={e.mark === '+'} onclick={() => toggle('mark', '+')}>+</button>
      <button class:on={e.mark === '−'} onclick={() => toggle('mark', '−')}>−</button>
    </div>
  </div>

  <label class="field">Bemerkung<input type="text" bind:value={e.note} /></label>

  <div class="row">
    <label class="field date">Datum<input type="date" bind:value={e.date} /></label>
    <label class="check"><input type="checkbox" bind:checked={e.transferred} /> In Notenmanager übertragen</label>
  </div>

  {#if error}<p class="error">{error}</p>{/if}

  {#snippet actions()}
    {#if entry?.id}<button class="btn danger left" onclick={() => (deleteOral(entry.id), onclose())}>Löschen</button>{/if}
    <button class="btn ghost" onclick={onclose}>Abbrechen</button>
    <button class="btn primary" onclick={save}>Speichern</button>
  {/snippet}
</Modal>

<style>
  .group {
    display: grid;
    gap: 0.4rem;
  }
  .lbl {
    font-weight: 500;
    font-size: 0.92rem;
  }
  .seg {
    display: flex;
    gap: 0.35rem;
  }
  .seg button {
    min-width: 2.6rem;
    padding: 0.45rem 0.7rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    background: #fff;
    font-weight: 600;
  }
  .seg button:hover {
    background: var(--bg-soft);
  }
  .seg button.on {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  .row {
    display: flex;
    align-items: end;
    gap: 1rem;
    justify-content: space-between;
  }
  .date input {
    font: inherit;
    padding: 0.45rem 0.6rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
  }
  .check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
  .left {
    margin-right: auto;
  }
</style>
