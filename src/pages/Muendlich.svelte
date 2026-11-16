<script>
  import Plus from '@lucide/svelte/icons/plus';
  import Check from '@lucide/svelte/icons/check';
  import { app } from '../lib/store.svelte.js';
  import { currentClass, studentsOf } from '../lib/classes.js';
  import { entriesOf, entriesOfClass, entryLabel, quickMark, markAllTransferred } from '../lib/oral.js';
  import { fmtShort } from '../lib/dates.js';
  import ClassPicker from '../components/ClassPicker.svelte';
  import OralDialog from '../components/OralDialog.svelte';
  import Modal from '../components/Modal.svelte';
  import TransferDialog from '../components/TransferDialog.svelte';
  import ListChecks from '@lucide/svelte/icons/list-checks';

  let dialog = $state(null);
  let onlyOpen = $state(false);

  const klass = $derived(currentClass());
  const students = $derived(klass ? studentsOf(klass.id) : []);
  const open = $derived(klass ? entriesOfClass(klass.id).filter((o) => !o.transferred).length : 0);
</script>

{#if !klass}
  <h1>Mündlich</h1>
  <div class="empty first">
    <p>Lege zuerst unter „Klasse“ eine Klasse mit Schülern an.</p>
    <button class="btn" onclick={() => (app.page = 'klasse')}>Zu den Klassen</button>
  </div>
{:else}
  <header>
    <div>
      <h1>Mündlich</h1>
      <p class="muted">
        {#if open}{open} {open === 1 ? 'Eintrag' : 'Einträge'} noch nicht in den Notenmanager übertragen{:else}Alles übertragen{/if}
      </p>
    </div>
    <div class="tools">
      <ClassPicker />
    </div>
  </header>

  <div class="toolbar">
    <label class="check"><input type="checkbox" bind:checked={onlyOpen} /> Nur nicht übertragene zeigen</label>
    {#if open}
      <span class="tb">
      <button class="btn primary" onclick={() => (dialog = { kind: 'transfer' })}><ListChecks size={17} /> Übertragen …</button>
      <button class="btn" onclick={() => (dialog = { kind: 'all' })}><Check size={17} /> Alle als übertragen markieren</button>
      </span>
    {/if}
  </div>

  {#if students.length === 0}
    <div class="empty"><p>In {klass.name} sind noch keine Schüler eingetragen.</p></div>
  {:else}
    <ul class="rows">
      {#each students as s (s.id)}
        {@const list = entriesOf(s.id).filter((o) => !onlyOpen || !o.transferred)}
        <li>
          <button class="name" onclick={() => (dialog = { kind: 'entry', student: s })}>
            <strong>{s.lastName}</strong>{s.firstName ? `, ${s.firstName}` : ''}
          </button>
          <div class="chips">
            {#each list as o (o.id)}
              <button
                class="chip"
                class:done={o.transferred}
                title="{fmtShort(o.date)}{o.note ? ' · ' + o.note : ''}{o.transferred ? ' · übertragen' : ''}"
                onclick={() => (dialog = { kind: 'entry', student: s, entry: $state.snapshot(o) })}
              >
                {entryLabel(o)}{#if o.note && !o.grade && !o.mark}…{/if}
              </button>
            {/each}
          </div>
          <div class="quick">
            <button class="btn icon q" title="Mitarbeit +" onclick={() => quickMark(s, '+')}>+</button>
            <button class="btn icon q" title="Mitarbeit −" onclick={() => quickMark(s, '−')}>−</button>
            <button class="btn small-btn" title="Eintrag mit Note oder Bemerkung" aria-label="Eintrag hinzufügen" onclick={() => (dialog = { kind: 'entry', student: s })}>
              <Plus size={15} /> Note
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
{/if}

{#if dialog?.kind === 'entry'}
  <OralDialog student={dialog.student} entry={dialog.entry ?? null} onclose={() => (dialog = null)} />
{:else if dialog?.kind === 'transfer'}
  <TransferDialog {klass} onclose={() => (dialog = null)} />
{:else if dialog?.kind === 'all'}
  <Modal title="Alle als übertragen markieren?" onclose={() => (dialog = null)}>
    <p class="muted">Alle {open} offenen Einträge der Klasse {klass.name} werden als in den Notenmanager übertragen markiert.</p>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (dialog = null)}>Abbrechen</button>
      <button class="btn primary" onclick={() => (markAllTransferred(klass.id), (dialog = null))}>Markieren</button>
    {/snippet}
  </Modal>
{/if}

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.2rem;
  }
  header p {
    margin-top: 0.2rem;
  }
  .first {
    margin-top: 1.6rem;
    max-width: 640px;
  }
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.8rem;
    max-width: 1000px;
    min-height: 2.4rem;
  }
  .tb {
    display: flex;
    gap: 0.5rem;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    max-width: 1000px;
    border-top: 1px solid var(--line);
  }
  .rows li {
    display: grid;
    grid-template-columns: 230px 1fr auto;
    align-items: center;
    gap: 0.8rem;
    padding: 0.35rem 0.2rem;
    border-bottom: 1px solid var(--line);
  }
  .name {
    border: none;
    background: none;
    text-align: left;
    padding: 0.3rem 0.4rem;
    border-radius: var(--radius-sm);
    color: var(--text);
  }
  .name:hover {
    background: var(--bg-soft);
  }
  .name strong {
    font-weight: 600;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .chip {
    border: 1px solid color-mix(in srgb, var(--accent) 35%, white);
    background: var(--accent-soft);
    color: var(--accent);
    border-radius: 999px;
    padding: 0.1rem 0.6rem;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .chip.done {
    background: #fff;
    border-color: var(--line);
    color: var(--muted);
    font-weight: 500;
  }
  .quick {
    display: flex;
    gap: 0.3rem;
    opacity: 0.55;
  }
  .rows li:hover .quick {
    opacity: 1;
  }
  .small-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.88rem;
  }
  .q {
    width: 2.1rem;
    justify-content: center;
    font-weight: 700;
  }
</style>
