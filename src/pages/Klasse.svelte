<script>
  import Plus from '@lucide/svelte/icons/plus';
  import Pencil from '@lucide/svelte/icons/pencil';
  import ClipboardPaste from '@lucide/svelte/icons/clipboard-paste';
  import UserPlus from '@lucide/svelte/icons/user-plus';
  import { app } from '../lib/store.svelte.js';
  import { currentClass, studentsOf } from '../lib/classes.js';
  import ClassPicker from '../components/ClassPicker.svelte';
  import ClassDialog from '../components/ClassDialog.svelte';
  import ImportDialog from '../components/ImportDialog.svelte';
  import StudentDialog from '../components/StudentDialog.svelte';
  import Seating from '../components/Seating.svelte';
  import ClassLists from '../components/ClassLists.svelte';
  import ClassLessons from '../components/ClassLessons.svelte';
  import ClassForgot from '../components/ClassForgot.svelte';
  import StudentOverview from '../components/StudentOverview.svelte';

  const TABS = [
    { id: 'schueler', label: 'Schüler' },
    { id: 'stunden', label: 'Stunden' },
    { id: 'sitzplan', label: 'Sitzplan' },
    { id: 'listen', label: 'Listen' },
    { id: 'vergessen', label: 'Hausaufgaben' },
  ];

  let tab = $state(app.jump?.classTab ?? 'schueler');
  let dialog = $state(app.jump?.studentId ? { kind: 'overview', studentId: app.jump.studentId } : null); // { kind: 'class' | 'import' | 'student' | 'overview', ... }
  const listId = app.jump?.listId ?? null;
  app.jump = null;
  let notice = $state('');

  const klass = $derived(currentClass());
  const students = $derived(klass ? studentsOf(klass.id) : []);

  function imported({ added, skipped }) {
    dialog = null;
    notice = `${added} Schüler übernommen` + (skipped ? `, ${skipped} schon vorhanden` : '') + '.';
    setTimeout(() => (notice = ''), 4000);
  }
</script>

{#if !klass}
  <h1>Klasse</h1>
  <div class="empty first">
    <p>Noch keine Klasse angelegt.</p>
    <button class="btn primary" onclick={() => (dialog = { kind: 'class' })}><Plus size={18} /> Erste Klasse anlegen</button>
  </div>
{:else}
  <header>
    <div class="title">
      <span class="dot" style:background={klass.color}></span>
      <div>
        <h1>{klass.name}</h1>
        <p class="muted">{[klass.subject, `${students.length} Schüler`].filter(Boolean).join(' · ')}</p>
      </div>
      <button class="btn ghost icon no-print" aria-label="Klasse bearbeiten" title="Klasse bearbeiten" onclick={() => (dialog = { kind: 'class', klass })}>
        <Pencil size={17} />
      </button>
    </div>
    <div class="tools no-print">
      <ClassPicker />
      <button class="btn" onclick={() => (dialog = { kind: 'class' })}><Plus size={18} /> Neue Klasse</button>
    </div>
  </header>

  <div class="tabs no-print" role="tablist">
    {#each TABS as t}
      <button role="tab" aria-selected={tab === t.id} class:active={tab === t.id} onclick={() => (tab = t.id)}>{t.label}</button>
    {/each}
  </div>

  {#if notice}<p class="notice">{notice}</p>{/if}

  {#if tab === 'schueler'}
    <div class="toolbar">
      <button class="btn primary" onclick={() => (dialog = { kind: 'import' })}><ClipboardPaste size={17} /> Namensliste einfügen</button>
      <button class="btn" onclick={() => (dialog = { kind: 'student' })}><UserPlus size={17} /> Einzeln hinzufügen</button>
    </div>

    {#if students.length === 0}
      <div class="empty">
        <p>Noch keine Schüler in {klass.name}. Am schnellsten geht es mit einer Namensliste aus Excel oder einem Dokument.</p>
      </div>
    {:else}
      <ol class="students">
        {#each students as s, i (s.id)}
          <li>
            <button onclick={() => (dialog = { kind: 'overview', studentId: s.id })} title="Übersicht öffnen">
              <span class="nr">{i + 1}</span>
              <span><strong>{s.lastName}</strong>{s.firstName ? `, ${s.firstName}` : ''}</span>
              <Pencil size={15} class="edit" />
            </button>
          </li>
        {/each}
      </ol>
    {/if}
  {:else if tab === 'stunden'}
    {#key klass.id}<ClassLessons {klass} />{/key}
  {:else if tab === 'sitzplan'}
    {#key klass.id}<Seating {klass} onstudent={(s) => (dialog = { kind: 'overview', studentId: s.id })} />{/key}
  {:else if tab === 'listen'}
    {#key klass.id}<ClassLists {klass} initialId={listId} />{/key}
  {:else}
    {#key klass.id}<ClassForgot {klass} onstudent={(s) => (dialog = { kind: 'overview', studentId: s.id })} />{/key}
  {/if}
{/if}

{#if dialog?.kind === 'class'}
  <ClassDialog klass={dialog.klass ?? null} onclose={() => (dialog = null)} />
{:else if dialog?.kind === 'import'}
  <ImportDialog {klass} onclose={() => (dialog = null)} ondone={imported} />
{:else if dialog?.kind === 'overview'}
  <StudentOverview studentId={dialog.studentId} onclose={() => (dialog = null)} onedit={(student) => (dialog = { kind: 'student', student })} />
{:else if dialog?.kind === 'student'}
  <StudentDialog {klass} student={dialog.student ?? null} onclose={() => (dialog = null)} />
{/if}

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.4rem;
  }
  .title {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
  .title .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex: none;
  }
  .tools {
    display: flex;
    gap: 0.5rem;
  }
  .first {
    margin-top: 1.6rem;
    max-width: 640px;
  }
  .tabs {
    display: flex;
    gap: 0.3rem;
    border-bottom: 1px solid var(--line);
    margin-bottom: 1.3rem;
  }
  .tabs button {
    border: none;
    background: none;
    padding: 0.55rem 0.9rem;
    color: var(--muted);
    font-weight: 500;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  .tabs button:hover {
    color: var(--text);
  }
  .tabs button.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
  .toolbar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .students {
    list-style: none;
    margin: 0;
    padding: 0;
    columns: 2 320px;
    column-gap: 1.25rem;
    max-width: 900px;
  }
  .students li {
    break-inside: avoid;
    border-bottom: 1px solid var(--line);
  }
  .students button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.55rem 0.5rem;
    border: none;
    background: none;
    text-align: left;
    color: var(--text);
    border-radius: var(--radius-sm);
  }
  .students button:hover {
    background: var(--bg-soft);
  }
  .nr {
    width: 1.6rem;
    color: var(--muted);
    font-size: 0.85rem;
    text-align: right;
  }
  .students strong {
    font-weight: 600;
  }
  .students :global(.edit) {
    margin-left: auto;
    color: var(--muted);
    opacity: 0;
  }
  .students button:hover :global(.edit) {
    opacity: 1;
  }
  .notice {
    margin-bottom: 1rem;
    padding: 0.6rem 0.9rem;
    border-radius: var(--radius-sm);
    background: var(--accent-soft);
    color: var(--accent);
    max-width: 900px;
  }
</style>
