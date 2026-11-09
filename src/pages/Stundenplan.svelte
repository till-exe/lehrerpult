<script>
  import Clock from '@lucide/svelte/icons/clock';
  import { app } from '../lib/store.svelte.js';
  import { WEEKDAYS, today, weekday } from '../lib/dates.js';
  import { periods, entriesFor, classOf, lessonName } from '../lib/timetable.js';
  import EntryDialog from '../components/EntryDialog.svelte';
  import PeriodsDialog from '../components/PeriodsDialog.svelte';

  let dialog = $state(null);
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
    <p class="muted">Gilt jede Woche. Änderungen wirken ab sofort; Tage, an denen du schon etwas notiert hast, behalten ihre Stunden.</p>
  </div>
  <button class="btn" onclick={() => (dialog = { kind: 'periods' })}><Clock size={17} /> Zeitraster</button>
</header>

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
