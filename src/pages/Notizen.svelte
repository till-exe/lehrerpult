<script>
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import Heading2 from '@lucide/svelte/icons/heading-2';
  import List from '@lucide/svelte/icons/list';
  import ListChecks from '@lucide/svelte/icons/list-checks';
  import { tick } from 'svelte';
  import { app } from '../lib/store.svelte.js';
  import { uid, sortedClasses } from '../lib/classes.js';
  import { classOf } from '../lib/timetable.js';
  import { parseNote, toggleCheck } from '../lib/markup.js';
  import Modal from '../components/Modal.svelte';

  let query = $state('');
  let filter = $state('alle');
  let selectedId = $state(null);
  let editing = $state(false);
  let confirmDelete = $state(false);
  let textarea = $state();

  const fmt = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });

  const notes = $derived(
    app.data.notes
      .filter((n) => filter === 'alle' || (filter === 'allgemein' ? !n.classId : n.classId === filter))
      .filter((n) => !query.trim() || `${n.title}\n${n.body}`.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => b.updated.localeCompare(a.updated)),
  );
  const note = $derived(app.data.notes.find((n) => n.id === selectedId) ?? null);
  const blocks = $derived(note ? parseNote(note.body) : []);

  const touch = () => (note.updated = new Date().toISOString());

  async function create() {
    const n = { id: uid(), title: '', body: '', classId: filter !== 'alle' && filter !== 'allgemein' ? filter : null, updated: new Date().toISOString() };
    app.data.notes.push(n);
    selectedId = n.id;
    editing = true;
    query = '';
    await tick();
    document.querySelector('.title-input')?.focus();
  }

  async function select(n) {
    selectedId = n.id;
    editing = !n.body.trim();
  }

  // Fügt am Zeilenanfang ein Format ein.
  async function insert(prefix) {
    if (!editing) {
      editing = true;
      await tick();
    }
    const ta = textarea;
    const pos = ta.selectionStart ?? note.body.length;
    const start = note.body.lastIndexOf('\n', pos - 1) + 1;
    note.body = note.body.slice(0, start) + prefix + note.body.slice(start);
    touch();
    await tick();
    ta.focus();
    ta.selectionStart = ta.selectionEnd = pos + prefix.length;
  }

  // Enter in einer Liste setzt die Liste fort.
  function onKey(e) {
    if (e.key !== 'Enter') return;
    const ta = e.currentTarget;
    const pos = ta.selectionStart;
    const lineStart = note.body.lastIndexOf('\n', pos - 1) + 1;
    const line = note.body.slice(lineStart, pos);
    const m = line.match(/^(\s*[-*] (\[[ xX]\] )?)(.*)$/);
    if (!m) return;
    e.preventDefault();
    if (!m[3].trim()) {
      note.body = note.body.slice(0, lineStart) + note.body.slice(pos);
      tick().then(() => (ta.selectionStart = ta.selectionEnd = lineStart));
    } else {
      const prefix = m[2] ? m[1].replace(/\[[xX]\]/, '[ ]') : m[1];
      note.body = note.body.slice(0, pos) + '\n' + prefix + note.body.slice(pos);
      tick().then(() => (ta.selectionStart = ta.selectionEnd = pos + 1 + prefix.length));
    }
    touch();
  }

  function remove() {
    app.data.notes = app.data.notes.filter((n) => n.id !== selectedId);
    selectedId = null;
    confirmDelete = false;
  }
</script>

<div class="layout">
  <aside>
    <div class="top">
      <h1>Notizen</h1>
      <button class="btn primary icon" aria-label="Neue Notiz" title="Neue Notiz" onclick={create}><Plus size={18} /></button>
    </div>
    <label class="search">
      <Search size={16} />
      <input type="text" placeholder="Suchen" bind:value={query} />
    </label>
    <select bind:value={filter}>
      <option value="alle">Alle Notizen</option>
      <option value="allgemein">Allgemein</option>
      {#each sortedClasses() as c}<option value={c.id}>{c.name}</option>{/each}
    </select>
    <ul>
      {#each notes as n (n.id)}
        {@const c = classOf(n.classId)}
        <li>
          <button class:active={n.id === selectedId} onclick={() => select(n)}>
            <span class="t">{n.title || 'Ohne Titel'}</span>
            <span class="muted small">{c ? `${c.name} · ` : ''}{fmt.format(new Date(n.updated))}</span>
          </button>
        </li>
      {:else}
        <li class="muted small none">{app.data.notes.length ? 'Nichts gefunden.' : 'Noch keine Notizen.'}</li>
      {/each}
    </ul>
  </aside>

  <section>
    {#if !note}
      <div class="empty">
        <p>Wähle links eine Notiz oder lege eine neue an.</p>
        <button class="btn" onclick={create}><Plus size={17} /> Neue Notiz</button>
      </div>
    {:else}
      <div class="bar">
        <select value={note.classId ?? ''} onchange={(e) => ((note.classId = e.currentTarget.value || null), touch())}>
          <option value="">Allgemein</option>
          {#each sortedClasses() as c}<option value={c.id}>{c.name}</option>{/each}
        </select>
        <div class="fmt">
          <button class="btn ghost icon" title="Überschrift" onclick={() => insert('## ')}><Heading2 size={18} /></button>
          <button class="btn ghost icon" title="Aufzählung" onclick={() => insert('- ')}><List size={18} /></button>
          <button class="btn ghost icon" title="Checkbox" onclick={() => insert('- [ ] ')}><ListChecks size={18} /></button>
        </div>
        <button class="btn" onclick={() => (editing = !editing)}>{editing ? 'Fertig' : 'Bearbeiten'}</button>
        <button class="btn ghost" onclick={() => (confirmDelete = true)}>Löschen</button>
      </div>

      <input class="title-input" type="text" placeholder="Titel" bind:value={note.title} oninput={touch} />

      {#if editing}
        <textarea bind:this={textarea} bind:value={note.body} oninput={touch} onkeydown={onKey} placeholder={'Text …\n\n## Überschrift\n- Aufzählung\n- [ ] Aufgabe'}></textarea>
      {:else}
        <div class="view" role="presentation" ondblclick={() => (editing = true)}>
          {#each blocks as b (b.line)}
            {#if b.type === 'h2'}<h2>{b.text}</h2>
            {:else if b.type === 'h3'}<h3>{b.text}</h3>
            {:else if b.type === 'check'}
              <label class="check" class:done={b.checked}>
                <input type="checkbox" checked={b.checked} onchange={() => ((note.body = toggleCheck(note.body, b.line)), touch())} />
                <span>{b.text}</span>
              </label>
            {:else if b.type === 'bullet'}<div class="bullet">{b.text}</div>
            {:else if b.type === 'gap'}<div class="gap"></div>
            {:else}<p>{b.text}</p>{/if}
          {/each}
          {#if !note.body.trim()}<p class="muted">Leer. Doppelklick zum Schreiben.</p>{/if}
        </div>
      {/if}
    {/if}
  </section>
</div>

{#if confirmDelete}
  <Modal title="Notiz löschen?" onclose={() => (confirmDelete = false)}>
    <p class="muted">„{note.title || 'Ohne Titel'}“ wird gelöscht.</p>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (confirmDelete = false)}>Abbrechen</button>
      <button class="btn danger" onclick={remove}>Löschen</button>
    {/snippet}
  </Modal>
{/if}

<style>
  .layout {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 2rem;
    height: calc(100vh - 5.2rem);
  }
  aside {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    min-height: 0;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }
  .search {
    position: relative;
    display: flex;
    align-items: center;
  }
  .search :global(svg) {
    position: absolute;
    left: 0.7rem;
    color: var(--muted);
  }
  .search input {
    padding-left: 2.1rem;
  }
  ul {
    list-style: none;
    margin: 0.3rem 0 0;
    padding: 0;
    overflow: auto;
  }
  li button {
    width: 100%;
    display: grid;
    text-align: left;
    border: none;
    background: none;
    padding: 0.55rem 0.7rem;
    border-radius: var(--radius-sm);
    color: var(--text);
  }
  li button:hover {
    background: var(--bg-soft);
  }
  li button.active {
    background: var(--accent-soft);
  }
  .t {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .none {
    padding: 0.5rem 0.7rem;
  }
  section {
    display: flex;
    flex-direction: column;
    min-height: 0;
    max-width: 860px;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.8rem;
  }
  .bar select {
    width: auto;
    min-width: 150px;
  }
  .fmt {
    display: flex;
    margin-right: auto;
    padding-left: 0.4rem;
    border-left: 1px solid var(--line);
  }
  .title-input {
    font-size: 1.6rem;
    font-weight: 600;
    border: none;
    padding: 0.2rem 0;
    margin-bottom: 0.6rem;
  }
  .title-input:focus {
    outline: none;
  }
  textarea {
    flex: 1;
    resize: none;
    border: 1px solid var(--line);
    padding: 0.9rem 1rem;
    line-height: 1.6;
  }
  .view {
    flex: 1;
    overflow: auto;
    line-height: 1.6;
    padding: 0.2rem 0;
  }
  .view h2 {
    font-size: 1.25rem;
    margin: 0.8rem 0 0.3rem;
  }
  .view h3 {
    font-size: 1.05rem;
    margin: 0.7rem 0 0.2rem;
  }
  .bullet {
    padding-left: 1.2rem;
    position: relative;
  }
  .bullet::before {
    content: '';
    position: absolute;
    left: 0.4rem;
    top: 0.68em;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--muted);
  }
  .check {
    display: flex;
    gap: 0.55rem;
    align-items: center;
  }
  .check.done span {
    color: var(--muted);
    text-decoration: line-through;
  }
  .gap {
    height: 0.7rem;
  }
</style>
