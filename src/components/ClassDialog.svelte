<script>
  import Modal from './Modal.svelte';
  import { COLORS, addClass, updateClass, deleteClass, studentsOf } from '../lib/classes.js';
  import { app } from '../lib/store.svelte.js';

  // klass = null → neue Klasse anlegen
  let { klass = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(klass?.name ?? '');
  // svelte-ignore state_referenced_locally
  let subject = $state(klass?.subject ?? '');
  // svelte-ignore state_referenced_locally
  let color = $state(klass?.color ?? COLORS[app.data.classes.length % COLORS.length]);
  let error = $state('');
  let confirmDelete = $state(false);

  function save() {
    if (!name.trim()) return (error = 'Bitte einen Namen eingeben, z. B. 7a.');
    if (klass) updateClass(klass.id, { name, subject, color });
    else addClass({ name, subject, color });
    onclose();
  }

  function remove() {
    deleteClass(klass.id);
    onclose();
  }

  const autofocus = (node) => node.focus();
</script>

{#if confirmDelete}
  <Modal title="Klasse {klass.name} löschen?" {onclose}>
    <p>Die Klasse und alle {studentsOf(klass.id).length} Schüler werden gelöscht.</p>
    <p class="muted">Über die Sicherungen in den Einstellungen lässt sich das rückgängig machen.</p>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (confirmDelete = false)}>Abbrechen</button>
      <button class="btn danger" onclick={remove}>Endgültig löschen</button>
    {/snippet}
  </Modal>
{:else}
  <Modal title={klass ? 'Klasse bearbeiten' : 'Neue Klasse'} {onclose}>
    <form id="class-form" onsubmit={(e) => (e.preventDefault(), save())}>
      <label class="field">Name<input type="text" bind:value={name} placeholder="z. B. 7a" use:autofocus /></label>
      <label class="field">Fach (optional)<input type="text" bind:value={subject} placeholder="z. B. Englisch" /></label>
      <div class="field">
        Farbe
        <div class="colors">
          {#each COLORS as c}
            <button type="button" class="swatch" class:active={c === color} style:background={c} aria-label="Farbe {c}" onclick={() => (color = c)}></button>
          {/each}
        </div>
      </div>
      {#if error}<p class="error">{error}</p>{/if}
    </form>
    {#snippet actions()}
      {#if klass}<button class="btn danger delete" onclick={() => (confirmDelete = true)}>Löschen</button>{/if}
      <button class="btn ghost" onclick={onclose}>Abbrechen</button>
      <button class="btn primary" type="submit" form="class-form">Speichern</button>
    {/snippet}
  </Modal>
{/if}

<style>
  form {
    display: grid;
    gap: 0.9rem;
  }
  .field {
    display: grid;
    gap: 0.4rem;
    font-weight: 500;
    font-size: 0.92rem;
  }
  .colors {
    display: flex;
    gap: 0.5rem;
  }
  .swatch {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px var(--line-strong);
    padding: 0;
  }
  .swatch.active {
    box-shadow: 0 0 0 2px var(--text);
  }
  .delete {
    margin-right: auto;
  }
</style>
