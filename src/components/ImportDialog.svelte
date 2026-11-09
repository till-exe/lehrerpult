<script>
  import Modal from './Modal.svelte';
  import { parseNames, sameName } from '../lib/names.js';
  import { addStudents, studentsOf } from '../lib/classes.js';

  let { klass, onclose, ondone } = $props();

  let text = $state('');
  let order = $state('last-first');
  const parsed = $derived(parseNames(text, order));
  const existing = $derived(studentsOf(klass.id));
  const isDuplicate = (p) => existing.some((s) => sameName(s, p));
  const fresh = $derived(parsed.filter((p) => !isDuplicate(p)));

  function doImport() {
    const res = addStudents(klass.id, parsed);
    ondone(res);
  }

  const autofocus = (node) => node.focus();
</script>

<Modal title="Namensliste einfügen – {klass.name}" {onclose} wide>
  <p class="muted small">Eine Person pro Zeile. Funktioniert mit „Nachname, Vorname“, mit zwei Spalten aus Excel oder mit „Vorname Nachname“.</p>
  <div class="cols">
    <textarea bind:value={text} rows="14" use:autofocus></textarea>
    <div class="preview">
      <div class="order">
        <label><input type="radio" bind:group={order} value="last-first" /> Nachname zuerst</label>
        <label><input type="radio" bind:group={order} value="first-last" /> Vorname zuerst</label>
      </div>
      {#if parsed.length === 0}
        <p class="muted small">Hier erscheint die Vorschau.</p>
      {:else}
        <ul>
          {#each parsed as p}
            <li class:dup={isDuplicate(p)}>
              <span><strong>{p.lastName}</strong>{p.firstName ? `, ${p.firstName}` : ''}</span>
              {#if isDuplicate(p)}<span class="small muted">schon vorhanden</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
  {#snippet actions()}
    <button class="btn ghost" onclick={onclose}>Abbrechen</button>
    <button class="btn primary" disabled={fresh.length === 0} onclick={doImport}>
      {fresh.length === 1 ? '1 Schüler übernehmen' : `${fresh.length} Schüler übernehmen`}
    </button>
  {/snippet}
</Modal>

<style>
  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  textarea {
    resize: vertical;
    min-height: 280px;
    line-height: 1.6;
  }
  .preview {
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 0.8rem;
    max-height: 340px;
    overflow: auto;
    display: grid;
    align-content: start;
    gap: 0.7rem;
  }
  .order {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
  }
  .order label {
    display: flex;
    gap: 0.35rem;
    align-items: center;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.15rem;
  }
  li {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }
  li.dup {
    color: var(--muted);
  }
  strong {
    font-weight: 600;
  }
</style>
