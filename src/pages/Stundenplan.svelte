<script>
  import Clock from '@lucide/svelte/icons/clock';
  import { app } from '../lib/store.svelte.js';
  import { WEEKDAYS, today, weekday } from '../lib/dates.js';
  import CalendarOff from '@lucide/svelte/icons/calendar-off';
  import Plus from '@lucide/svelte/icons/plus';
  import { periods, entriesFor, classOf, lessonName, activePlan, switchPlan, addPlan, deletePlan } from '../lib/timetable.js';
  import HolidaysDialog from '../components/HolidaysDialog.svelte';
  import Modal from '../components/Modal.svelte';
  import EntryDialog from '../components/EntryDialog.svelte';
  import PeriodsDialog from '../components/PeriodsDialog.svelte';

  let dialog = $state(null);
  let planName = $state('');
  const plan = $derived(activePlan());

  function submitPlan() {
    if (!planName.trim()) return;
    if (dialog.kind === 'newplan') addPlan(planName.trim());
    else plan.name = planName.trim();
    dialog = null;
  }
  const autofocus = (node) => node.focus();
  const todayNr = weekday(today());

  // Welche Felder sind von einer Doppelstunde darüber belegt?
  const covered = $derived.by(() => {
    const set = new Set();
    for (const e of app.data.timetable) for (let k = 1; k < e.length; k++) set.add(`${e.day}-${e.period + k}`);
    return set;
  });

  const at = (day, period) => entriesFor(day).find((e) => e.period === period);
</script>

<header>
  <div>
    <h1>Stundenplan</h1>
    <p class="muted">Gilt jede Woche. Bei Änderungen wandern geplante Themen mit zur jeweils nächsten Stunde der Klasse.</p>
  </div>
  <div class="tools">
    <button class="btn" onclick={() => (dialog = { kind: 'holidays' })}><CalendarOff size={17} /> Ferien</button>
    <button class="btn" onclick={() => (dialog = { kind: 'periods' })}><Clock size={17} /> Zeitraster</button>
  </div>
</header>

<div class="plans">
  {#each app.data.plans as p (p.id)}
    <button class:on={p.id === plan.id} onclick={() => switchPlan(p.id)}>{p.name}</button>
  {/each}
  <button class="addplan" title="Kopie des aktuellen Plans als neue Variante" onclick={() => ((planName = ''), (dialog = { kind: 'newplan' }))}><Plus size={15} /> Variante</button>
  <span class="planedit">
    <button class="link small" onclick={() => ((planName = plan.name), (dialog = { kind: 'renameplan' }))}>Umbenennen</button>
    {#if app.data.plans.length > 1}<button class="link small" onclick={() => (dialog = { kind: 'deleteplan' })}>Variante löschen</button>{/if}
  </span>
</div>

<div class="grid" style:grid-template-rows="auto repeat({periods().length}, minmax(64px, auto))">
  <div class="corner"></div>
  {#each WEEKDAYS as d, i}
    <div class="dayhead" class:today={todayNr === i + 1} style:grid-column={i + 2}>{d}</div>
  {/each}

  {#each periods() as p, pi}
    <div class="time" style:grid-row={pi + 2}>
      <strong>{pi + 1}.</strong>
      <span>{p.start}</span>
      <span>{p.end}</span>
    </div>
    {#each WEEKDAYS as _, di}
      {@const e = at(di + 1, pi + 1)}
      {#if e}
        {@const c = classOf(e.classId)}
        <button
          class="entry"
          style:grid-column={di + 2}
          style:grid-row="{pi + 2} / span {e.length}"
          style:--c={c?.color ?? 'var(--muted)'}
          onclick={() => (dialog = { kind: 'entry', entry: $state.snapshot(e) })}
        >
          <strong>{lessonName(e)}</strong>
          <span>{[e.subject, e.room].filter(Boolean).join(' · ')}</span>
        </button>
      {:else if !covered.has(`${di + 1}-${pi + 1}`)}
        <button
          class="free"
          style:grid-column={di + 2}
          style:grid-row={pi + 2}
          aria-label="Stunde eintragen"
          onclick={() => (dialog = { kind: 'entry', entry: { day: di + 1, period: pi + 1 } })}
        ></button>
      {/if}
    {/each}
  {/each}
</div>

{#if dialog?.kind === 'entry'}
  <EntryDialog entry={dialog.entry} onclose={() => (dialog = null)} />
{:else if dialog?.kind === 'periods'}
  <PeriodsDialog onclose={() => (dialog = null)} />
{:else if dialog?.kind === 'holidays'}
  <HolidaysDialog onclose={() => (dialog = null)} />
{:else if dialog?.kind === 'newplan' || dialog?.kind === 'renameplan'}
  <Modal title={dialog.kind === 'newplan' ? 'Neue Variante' : 'Variante umbenennen'} onclose={() => (dialog = null)}>
    {#if dialog.kind === 'newplan'}<p class="muted small">Die neue Variante startet als Kopie von „{plan.name}“. Danach wechselst du mit einem Klick zwischen den Varianten.</p>{/if}
    <form id="plan-form" onsubmit={(e) => (e.preventDefault(), submitPlan())}>
      <label class="field">Name<input type="text" bind:value={planName} use:autofocus /></label>
    </form>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (dialog = null)}>Abbrechen</button>
      <button class="btn primary" type="submit" form="plan-form">Speichern</button>
    {/snippet}
  </Modal>
{:else if dialog?.kind === 'deleteplan'}
  <Modal title="Variante „{plan.name}“ löschen?" onclose={() => (dialog = null)}>
    <p class="muted">Der Stundenplan dieser Variante wird gelöscht. Danach gilt wieder die andere Variante.</p>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (dialog = null)}>Abbrechen</button>
      <button class="btn danger" onclick={() => (deletePlan(plan.id), (dialog = null))}>Löschen</button>
    {/snippet}
  </Modal>
{/if}

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.4rem;
  }
  header p {
    margin-top: 0.3rem;
    font-size: 0.92rem;
  }
  .tools {
    display: flex;
    gap: 0.5rem;
  }
  .plans {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: 1.1rem;
  }
  .plans > button {
    border: 1px solid var(--line-strong);
    background: #fff;
    border-radius: 999px;
    padding: 0.3rem 0.9rem;
    font-weight: 500;
  }
  .plans > button.on {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent);
  }
  .plans .addplan {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    border-style: dashed;
    color: var(--muted);
  }
  .planedit {
    display: flex;
    gap: 0.9rem;
    margin-left: 0.6rem;
  }
  .planedit .link {
    color: var(--muted);
  }
  .grid {
    display: grid;
    grid-template-columns: 74px repeat(5, minmax(0, 1fr));
    gap: 6px;
    max-width: 1200px;
  }
  .dayhead {
    font-weight: 600;
    padding: 0.3rem 0.6rem;
    color: var(--muted);
  }
  .dayhead.today {
    color: var(--accent);
  }
  .time {
    grid-column: 1;
    display: grid;
    align-content: center;
    font-size: 0.8rem;
    color: var(--muted);
    line-height: 1.3;
  }
  .time strong {
    color: var(--text);
    font-size: 0.9rem;
  }
  .free {
    border: 1px dashed transparent;
    border-radius: var(--radius-sm);
    background: var(--bg-soft);
  }
  .free:hover {
    border-color: var(--line-strong);
    background: #fff;
  }
  .free:hover::after {
    content: '+';
    color: var(--muted);
    font-size: 1.2rem;
  }
  .entry {
    border: 1px solid var(--line);
    border-left: 4px solid var(--c);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--c) 7%, white);
    text-align: left;
    padding: 0.5rem 0.7rem;
    display: grid;
    align-content: start;
    gap: 0.1rem;
    color: var(--text);
  }
  .entry:hover {
    background: color-mix(in srgb, var(--c) 13%, white);
  }
  .entry span {
    font-size: 0.82rem;
    color: var(--muted);
  }
</style>
