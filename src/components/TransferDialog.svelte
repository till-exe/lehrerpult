<script>
  import Copy from '@lucide/svelte/icons/copy';
  import Check from '@lucide/svelte/icons/check';
  import Modal from './Modal.svelte';
  import { app } from '../lib/store.svelte.js';
  import { studentsOf } from '../lib/classes.js';
  import { entriesOf, entryLabel } from '../lib/oral.js';
  import { fmtShort } from '../lib/dates.js';

  let { klass, onclose } = $props();

  // Die beim Öffnen offenen Einträge bleiben sichtbar, auch wenn sie abgehakt werden.
  // svelte-ignore state_referenced_locally
  const ids = new Set(app.data.oral.filter((o) => o.classId === klass.id && !o.transferred).map((o) => o.id));
  const groups = $derived(
    studentsOf(klass.id)
      .map((s) => ({ student: s, entries: entriesOf(s.id).filter((o) => ids.has(o.id)) }))
      .filter((g) => g.entries.length),
  );
  const left = $derived(groups.reduce((n, g) => n + g.entries.filter((o) => !o.transferred).length, 0));
  let copied = $state(false);

  const line = (o) => `${entryLabel(o)} (${fmtShort(o.date)})${o.note ? ' ' + o.note : ''}`;

  async function copy() {
    const text = groups.map((g) => `${g.student.lastName}, ${g.student.firstName}: ${g.entries.map(line).join('; ')}`).join('\n');
    await navigator.clipboard.writeText(text);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<Modal title="In den Notenmanager übertragen – {klass.name}" {onclose} wide>
  <p class="muted small">Hake ab, was du eingetragen hast. Noch offen: {left}</p>
  <ul>
    {#each groups as g (g.student.id)}
      <li>
        <strong>{g.student.lastName}, {g.student.firstName}</strong>
        <div class="entries">
          {#each g.entries as o (o.id)}
            <label class:done={o.transferred}><input type="checkbox" bind:checked={o.transferred} /> <span>{line(o)}</span></label>
          {/each}
        </div>
      </li>
    {/each}
  </ul>
  {#snippet actions()}
    <button class="btn left" onclick={copy}>{#if copied}<Check size={16} /> Kopiert{:else}<Copy size={16} /> Als Text kopieren{/if}</button>
    <button class="btn primary" onclick={onclose}>Fertig</button>
  {/snippet}
</Modal>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 55vh;
    overflow: auto;
    border-top: 1px solid var(--line);
  }
  li {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 1rem;
    padding: 0.45rem 0.2rem;
    border-bottom: 1px solid var(--line);
  }
  strong {
    font-weight: 600;
  }
  .entries {
    display: grid;
    gap: 0.15rem;
  }
  label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  label.done span {
    color: var(--muted);
    text-decoration: line-through;
  }
  .left {
    margin-right: auto;
  }
</style>
