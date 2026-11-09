<script>
  import Plus from '@lucide/svelte/icons/plus';
  import { app } from '../lib/store.svelte.js';
  import { studentsOf, uid } from '../lib/classes.js';
  import { today, fmtShort } from '../lib/dates.js';
  import Modal from './Modal.svelte';

  let { klass } = $props();

  const lists = $derived(app.data.lists.filter((l) => l.classId === klass.id).sort((a, b) => b.created.localeCompare(a.created)));
  const students = $derived(studentsOf(klass.id));
  let selectedId = $state(null);
  const list = $derived(lists.find((l) => l.id === selectedId) ?? lists[0] ?? null);
  let dialog = $state(null);
  let name = $state('');

  const done = (l) => students.filter((s) => l.entries[s.id]?.checked).length;

  function entry(s) {
    if (!list.entries[s.id]) list.entries[s.id] = { checked: false, note: '' };
    return list.entries[s.id];
  }

  function create() {
    if (!name.trim()) return;
    const l = { id: uid(), classId: klass.id, name: name.trim(), created: today(), entries: {} };
    app.data.lists.push(l);
    selectedId = l.id;
    dialog = null;
  }

  function rename() {
    if (name.trim()) list.name = name.trim();
    dialog = null;
  }

  function remove() {
    app.data.lists = app.data.lists.filter((l) => l.id !== list.id);
    selectedId = null;
    dialog = null;
  }

  const autofocus = (node) => node.focus();
</script>

<div class="layout">
  <aside>
    <button class="btn primary" onclick={() => ((name = ''), (dialog = 'new'))}><Plus size={17} /> Neue Liste</button>
    <ul>
      {#each lists as l (l.id)}
        <li>
          <button class:active={list?.id === l.id} onclick={() => (selectedId = l.id)}>
            <span>{l.name}</span>
            <span class="muted small">{done(l)}/{students.length} · {fmtShort(l.created)}</span>
          </button>
        </li>
      {/each}
    </ul>
  </aside>

  <section>
    {#if !list}
      <div class="empty"><p>Listen zum Abhaken, z. B. „Elternbrief zurück“ oder „Geld Wandertag“.</p></div>
    {:else}
      <div class="head">
        <div>
          <h2>{list.name}</h2>
          <p class="muted small">{done(list)} von {students.length} abgehakt</p>
        </div>
        <div class="tools">
          <button class="btn ghost" onclick={() => ((name = list.name), (dialog = 'rename'))}>Umbenennen</button>
          <button class="btn ghost" onclick={() => (dialog = 'delete')}>Löschen</button>
        </div>
      </div>
      <ul class="rows">
        {#each students as s (s.id)}
          {@const e = list.entries[s.id]}
          <li class:checked={e?.checked}>
            <label>
              <input type="checkbox" checked={e?.checked ?? false} onchange={(ev) => (entry(s).checked = ev.currentTarget.checked)} />
              <span><strong>{s.lastName}</strong>{s.firstName ? `, ${s.firstName}` : ''}</span>
            </label>
            <input type="text" class="note" placeholder="Anmerkung" value={e?.note ?? ''} oninput={(ev) => (entry(s).note = ev.currentTarget.value)} />
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

{#if dialog === 'new' || dialog === 'rename'}
  <Modal title={dialog === 'new' ? 'Neue Liste' : 'Liste umbenennen'} onclose={() => (dialog = null)}>
    <form id="list-form" onsubmit={(e) => (e.preventDefault(), dialog === 'new' ? create() : rename())}>
      <label class="field">Name<input type="text" bind:value={name} use:autofocus /></label>
    </form>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (dialog = null)}>Abbrechen</button>
      <button class="btn primary" type="submit" form="list-form">{dialog === 'new' ? 'Anlegen' : 'Speichern'}</button>
    {/snippet}
  </Modal>
{:else if dialog === 'delete'}
  <Modal title="Liste „{list.name}“ löschen?" onclose={() => (dialog = null)}>
    <p class="muted">Alle Haken und Anmerkungen dieser Liste gehen verloren.</p>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (dialog = null)}>Abbrechen</button>
      <button class="btn danger" onclick={remove}>Löschen</button>
    {/snippet}
  </Modal>
{/if}

<style>
  .layout {
    display: grid;
    grid-template-columns: 250px minmax(0, 1fr);
    gap: 1.5rem;
    align-items: start;
    max-width: 1100px;
  }
  aside {
    display: grid;
    gap: 0.8rem;
  }
  aside ul,
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  aside li button {
    width: 100%;
    display: grid;
    text-align: left;
    border: none;
    background: none;
    padding: 0.5rem 0.7rem;
    border-radius: var(--radius-sm);
    color: var(--text);
  }
  aside li button:hover {
    background: var(--bg-soft);
  }
  aside li button.active {
    background: var(--accent-soft);
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.8rem;
  }
  .tools {
    display: flex;
    gap: 0.2rem;
  }
  .rows {
    border-top: 1px solid var(--line);
  }
  .rows li {
    display: grid;
    grid-template-columns: 260px 1fr;
    align-items: center;
    gap: 1rem;
    padding: 0.3rem 0.3rem;
    border-bottom: 1px solid var(--line);
  }
  .rows label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .rows strong {
    font-weight: 600;
  }
  .rows li.checked label span {
    color: var(--muted);
  }
  .note {
    border-color: transparent;
    padding: 0.35rem 0.5rem;
    font-size: 0.9rem;
  }
  .note:hover {
    border-color: var(--line);
  }
</style>
