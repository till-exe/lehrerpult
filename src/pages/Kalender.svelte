<script>
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Plus from '@lucide/svelte/icons/plus';
  import { app } from '../lib/store.svelte.js';
  import { today, toIso, fromIso, addDays, weekday, fmtLong } from '../lib/dates.js';
  import { freeDay } from '../lib/holidays.js';
  import { examsOn, eventsOn } from '../lib/exams.js';
  import { classOf, lessonsFor } from '../lib/timetable.js';
  import Modal from '../components/Modal.svelte';
  import ExamDialog from '../components/ExamDialog.svelte';
  import EventDialog from '../components/EventDialog.svelte';

  const now = today();
  let month = $state(now.slice(0, 7)); // "JJJJ-MM"
  let dialog = $state(null);

  const title = $derived(new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(fromIso(`${month}-01`)));

  function shift(n) {
    const d = fromIso(`${month}-01`);
    d.setMonth(d.getMonth() + n);
    month = toIso(d).slice(0, 7);
  }

  // Wochen von Montag bis Sonntag, die den Monat abdecken.
  const weeks = $derived.by(() => {
    const first = `${month}-01`;
    let d = addDays(first, 1 - weekday(first));
    const out = [];
    while (d.slice(0, 7) <= month) {
      out.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)));
      d = addDays(d, 7);
    }
    return out;
  });

  const openDay = (date) => ((app.jump = { date }), (app.page = 'start'));
</script>

<header>
  <h1>{title}</h1>
  <div class="tools">
    <button class="btn" onclick={() => (dialog = { kind: 'event', event: { date: now } })}><Plus size={17} /> Termin</button>
    {#if app.data.classes.length}
      <button class="btn" onclick={() => (dialog = { kind: 'exam', exam: { date: now } })}><Plus size={17} /> Leistungsnachweis</button>
    {/if}
    <span class="nav">
      <button class="btn icon" aria-label="Vorheriger Monat" onclick={() => shift(-1)}><ChevronLeft size={18} /></button>
      <button class="btn" disabled={month === now.slice(0, 7)} onclick={() => (month = now.slice(0, 7))}>Heute</button>
      <button class="btn icon" aria-label="Nächster Monat" onclick={() => shift(1)}><ChevronRight size={18} /></button>
    </span>
  </div>
</header>

<div class="cal">
  {#each ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as d, i}
    <div class="wd" class:we={i > 4}>{d}</div>
  {/each}
  {#each weeks as week}
    {#each week as date, i (date)}
      {@const free = freeDay(date)}
      {@const lessons = i < 5 && !free ? lessonsFor(date).filter((l) => !l.cancelled).length : 0}
      <div class="day" class:other={date.slice(0, 7) !== month} class:we={i > 4} class:free class:today={date === now}>
        <button class="num" title="Tag öffnen" onclick={() => (dialog = { kind: 'day', date })}>
          <span>{Number(date.slice(8))}</span>
          {#if lessons}<span class="count">{lessons} Std.</span>{/if}
        </button>
        {#if free}<span class="freename">{free}</span>{/if}
        {#each examsOn(date) as x (x.id)}
          {@const c = classOf(x.classId)}
          <button class="item exam" style:--c={c?.color ?? 'var(--muted)'} title={x.topic} onclick={() => (dialog = { kind: 'exam', exam: $state.snapshot(x) })}>
            <strong>{c?.name}</strong> {x.type}
          </button>
        {/each}
        {#each eventsOn(date) as e (e.id)}
          <button class="item" title={e.note} onclick={() => (dialog = { kind: 'event', event: $state.snapshot(e) })}>
            {#if e.time}<span class="muted">{e.time}</span>{/if} {e.title}
          </button>
        {/each}
      </div>
    {/each}
  {/each}
</div>

{#if dialog?.kind === 'exam'}
  <ExamDialog exam={dialog.exam} onclose={() => (dialog = null)} />
{:else if dialog?.kind === 'event'}
  <EventDialog event={dialog.event} onclose={() => (dialog = null)} />
{:else if dialog?.kind === 'day'}
  {@const date = dialog.date}
  {@const lessons = lessonsFor(date)}
  <Modal title={fmtLong(date)} onclose={() => (dialog = null)}>
    {#if freeDay(date)}<p class="muted">{freeDay(date)} – unterrichtsfrei</p>{/if}
    {#if lessons.length}
      <ul class="daylist">
        {#each lessons as l}
          <li class:muted={l.cancelled}><span class="p">{l.period}.{l.length > 1 ? `–${l.period + l.length - 1}.` : ''}</span><strong>{classOf(l.classId)?.name ?? l.title}</strong><span class="note">{l.cancelled ? 'entfällt' : l.note}</span></li>
        {/each}
      </ul>
    {:else if !freeDay(date)}
      <p class="muted small">Keine Stunden.</p>
    {/if}
    {#snippet actions()}
      <button class="btn left" onclick={() => openDay(date)}>Tagesansicht</button>
      <button class="btn" onclick={() => (dialog = { kind: 'event', event: { date } })}>Termin</button>
      {#if app.data.classes.length}<button class="btn" onclick={() => (dialog = { kind: 'exam', exam: { date } })}>Leistungsnachweis</button>{/if}
    {/snippet}
  </Modal>
{/if}

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.2rem;
  }
  .tools,
  .nav {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }
  .nav {
    margin-left: 0.8rem;
  }
  .cal {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr)) repeat(2, minmax(0, 0.55fr));
    border-top: 1px solid var(--line);
    border-left: 1px solid var(--line);
    max-width: 1250px;
  }
  .wd {
    padding: 0.35rem 0.6rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--muted);
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .day {
    min-height: 112px;
    padding: 0.25rem 0.3rem 0.4rem;
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }
  .day.we,
  .wd.we {
    background: var(--bg-soft);
  }
  .day.free {
    background: var(--accent-soft);
  }
  .day.other {
    opacity: 0.45;
  }
  .num {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border: none;
    background: none;
    padding: 0.1rem 0.3rem;
    border-radius: 6px;
    font-weight: 600;
    color: var(--text);
  }
  .num:hover {
    background: rgba(0, 0, 0, 0.06);
  }
  .day.today .num span:first-child {
    background: var(--accent);
    color: #fff;
    border-radius: 999px;
    padding: 0 0.45rem;
  }
  .count {
    font-size: 0.74rem;
    font-weight: 400;
    color: var(--muted);
  }
  .freename {
    font-size: 0.78rem;
    color: var(--accent);
    padding: 0 0.3rem;
  }
  .item {
    border: none;
    background: var(--bg-side);
    border-radius: 5px;
    padding: 0.12rem 0.4rem;
    font-size: 0.8rem;
    text-align: left;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: none;
  }
  .item.exam {
    background: color-mix(in srgb, var(--c) 14%, white);
    border-left: 3px solid var(--c);
  }
  .item:hover {
    filter: brightness(0.96);
  }
  .daylist {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.25rem;
  }
  .daylist li {
    display: grid;
    grid-template-columns: 3.2rem 5rem 1fr;
    gap: 0.5rem;
  }
  .p {
    color: var(--muted);
  }
  .note {
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .left {
    margin-right: auto;
  }
</style>
