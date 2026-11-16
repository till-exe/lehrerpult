<script>
  import Modal from './Modal.svelte';
  import { sortedClasses, currentClass } from '../lib/classes.js';
  import { EXAM_TYPES, saveExam, deleteExam } from '../lib/exams.js';
  import { today } from '../lib/dates.js';

  let { exam = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let e = $state({ classId: currentClass()?.id ?? '', date: today(), type: 'Schulaufgabe', topic: '', note: '', ...(exam ?? {}) });
  let error = $state('');

  function save() {
    if (!e.classId) return (error = 'Bitte eine Klasse wählen.');
    if (!e.date) return (error = 'Bitte ein Datum wählen.');
    saveExam($state.snapshot(e));
    onclose();
  }
</script>

<Modal title={exam?.id ? 'Leistungsnachweis bearbeiten' : 'Neuer Leistungsnachweis'} {onclose}>
  <form id="exam-form" onsubmit={(ev) => (ev.preventDefault(), save())}>
    <div class="row">
      <label class="field">Klasse
        <select bind:value={e.classId}>
          {#each sortedClasses() as c}<option value={c.id}>{c.name}</option>{/each}
        </select>
      </label>
      <label class="field">Datum<input type="date" bind:value={e.date} /></label>
    </div>
    <label class="field">Art
      <select bind:value={e.type}>
        {#each EXAM_TYPES as t}<option>{t}</option>{/each}
      </select>
    </label>
    <label class="field">Thema<input type="text" bind:value={e.topic} /></label>
    <label class="field">Notiz<input type="text" bind:value={e.note} /></label>
    {#if error}<p class="error">{error}</p>{/if}
  </form>
  {#snippet actions()}
    {#if exam?.id}<button class="btn danger left" onclick={() => (deleteExam(exam.id), onclose())}>Löschen</button>{/if}
    <button class="btn ghost" onclick={onclose}>Abbrechen</button>
    <button class="btn primary" type="submit" form="exam-form">Speichern</button>
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
  input[type='date'] {
    font: inherit;
    padding: 0.5rem 0.6rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
  }
  .left {
    margin-right: auto;
  }
</style>
