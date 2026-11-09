<script>
  import Plus from '@lucide/svelte/icons/plus';
  import { app } from '../lib/store.svelte.js';
  import { upcomingExams, pastExams } from '../lib/exams.js';
  import { fmtShort, relativeLabel } from '../lib/dates.js';
  import { classOf } from '../lib/timetable.js';
  import ExamDialog from '../components/ExamDialog.svelte';
  import GradeKey from '../components/GradeKey.svelte';

  let tab = $state('termine');
  let dialog = $state(null);
  const upcoming = $derived(upcomingExams());
  const past = $derived(pastExams());
</script>

{#snippet list(items)}
  <ul class="exams">
    {#each items as x (x.id)}
      {@const c = classOf(x.classId)}
      <li>
        <button onclick={() => (dialog = { exam: $state.snapshot(x) })}>
          <span class="date">{fmtShort(x.date)}</span>
          <span class="cls"><span class="dot" style:background={c?.color}></span>{c?.name ?? '–'}</span>
          <span><span class="badge">{x.type}</span> {x.topic}</span>
          <span class="muted small rel">{relativeLabel(x.date)}</span>
        </button>
      </li>
    {/each}
  </ul>
{/snippet}

<header>
  <h1>Leistungsnachweise</h1>
  {#if tab === 'termine' && app.data.classes.length}
    <button class="btn primary" onclick={() => (dialog = {})}><Plus size={18} /> Termin eintragen</button>
  {/if}
</header>

<div class="tabs" role="tablist">
  <button role="tab" class:active={tab === 'termine'} aria-selected={tab === 'termine'} onclick={() => (tab = 'termine')}>Termine</button>
  <button role="tab" class:active={tab === 'schluessel'} aria-selected={tab === 'schluessel'} onclick={() => (tab = 'schluessel')}>Notenschlüssel</button>
</div>

{#if tab === 'termine'}
  {#if app.data.classes.length === 0}
    <div class="empty"><p>Lege zuerst unter „Klasse“ deine Klassen an.</p></div>
  {:else if upcoming.length === 0}
    <div class="empty"><p>Keine anstehenden Leistungsnachweise.</p></div>
  {:else}
    {@render list(upcoming)}
  {/if}
  {#if past.length}
    <details>
      <summary>Vergangene ({past.length})</summary>
      {@render list(past)}
    </details>
  {/if}
{:else}
  <GradeKey />
{/if}

{#if dialog}
  <ExamDialog exam={dialog.exam ?? null} onclose={() => (dialog = null)} />
{/if}

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.2rem;
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
  .tabs button.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
  .exams {
    list-style: none;
    margin: 0;
    padding: 0;
    max-width: 900px;
    border-top: 1px solid var(--line);
  }
  .exams li {
    border-bottom: 1px solid var(--line);
  }
  .exams button {
    width: 100%;
    display: grid;
    grid-template-columns: 110px 110px 1fr auto;
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem 0.5rem;
    border: none;
    background: none;
    text-align: left;
    color: var(--text);
  }
  .exams button:hover {
    background: var(--bg-soft);
  }
  .date {
    font-weight: 600;
  }
  .cls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--muted);
  }
  details {
    margin-top: 1.5rem;
    max-width: 900px;
  }
  summary {
    cursor: pointer;
    color: var(--muted);
    font-weight: 500;
    margin-bottom: 0.6rem;
  }
</style>
