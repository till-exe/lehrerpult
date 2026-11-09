<script>
  import Modal from './Modal.svelte';
  import { addStudents, updateStudent, removeStudent } from '../lib/classes.js';

  // student = null → neuen Schüler anlegen
  let { klass, student = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let firstName = $state(student?.firstName ?? '');
  // svelte-ignore state_referenced_locally
  let lastName = $state(student?.lastName ?? '');
  let error = $state('');
  let confirmRemove = $state(false);

  function save() {
    if (!firstName.trim() && !lastName.trim()) return (error = 'Bitte einen Namen eingeben.');
    if (student) updateStudent(student.id, { firstName, lastName });
    else if (addStudents(klass.id, [{ firstName, lastName }]).added === 0) return (error = 'Diesen Namen gibt es in der Klasse schon.');
    onclose();
  }

  const autofocus = (node) => node.focus();
</script>

{#if confirmRemove}
  <Modal title="{student.firstName} {student.lastName} entfernen?" {onclose}>
    <p class="muted">Der Schüler wird aus der Klasse {klass.name} entfernt.</p>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (confirmRemove = false)}>Abbrechen</button>
      <button class="btn danger" onclick={() => (removeStudent(student.id), onclose())}>Entfernen</button>
    {/snippet}
  </Modal>
{:else}
  <Modal title={student ? 'Schüler bearbeiten' : `Schüler hinzufügen – ${klass.name}`} {onclose}>
    <form id="student-form" onsubmit={(e) => (e.preventDefault(), save())}>
      <label class="field">Vorname<input type="text" bind:value={firstName} use:autofocus /></label>
      <label class="field">Nachname<input type="text" bind:value={lastName} /></label>
      {#if error}<p class="error">{error}</p>{/if}
    </form>
    {#snippet actions()}
      {#if student}<button class="btn danger remove" onclick={() => (confirmRemove = true)}>Entfernen</button>{/if}
      <button class="btn ghost" onclick={onclose}>Abbrechen</button>
      <button class="btn primary" type="submit" form="student-form">Speichern</button>
    {/snippet}
  </Modal>
{/if}

<style>
  form {
    display: grid;
    gap: 0.9rem;
  }
  .remove {
    margin-right: auto;
  }
</style>
