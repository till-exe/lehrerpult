<script>
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { app } from '../lib/store.svelte.js';
  import { today, addDays, fmtLong, fmtShort, relativeLabel, weekday } from '../lib/dates.js';
  import Plus from '@lucide/svelte/icons/plus';
  import { lessonsFor, openFromEarlier, toggleTodo, lessonName, lessonKey, classOf } from '../lib/timetable.js';
  import { freeDay } from '../lib/holidays.js';
  import DayLessonDialog from '../components/DayLessonDialog.svelte';
  import { upcomingExams } from '../lib/exams.js';
  import LessonCard from '../components/LessonCard.svelte';
  import GeneralTodos from '../components/GeneralTodos.svelte';

  let date = $state(app.jump?.date ?? today());
  if (app.jump?.date) app.jump = null;
  let dialog = $state(null);
  const free = $derived(freeDay(date));
  const isToday = $derived(date === today());
  const lessons = $derived(lessonsFor(date));
  const earlier = $derived(isToday ? openFromEarlier() : []);
  const exams = $derived(upcomingExams(14));
  const weekend = $derived(weekday(date) > 5);
</script>

<header>
  <div>
    <p class="muted">{relativeLabel(date) || ' '}</p>
    <h1>{fmtLong(date)}</h1>
  </div>
  <div class="nav">
    <button class="btn icon" aria-label="Vorheriger Tag" onclick={() => (date = addDays(date, -1))}><ChevronLeft size={18} /></button>
    <button class="btn" disabled={isToday} onclick={() => (date = today())}>Heute</button>
    <button class="btn icon" aria-label="Nächster Tag" onclick={() => (date = addDays(date, 1))}><ChevronRight size={18} /></button>
  </div>
</header>

<div class="grid">
  <div class="col">
    {#if earlier.length}
      <section class="card earlier">
        <div class="card-head"><h2>Offen von früher</h2></div>
        <ul>
          {#each earlier as o (o.todo.id)}
            <li>
              <label>
                <input type="checkbox" checked={o.todo.done} onchange={() => toggleTodo(o.date, o.key, o.todo.id)} />
                <span>{o.todo.text}</span>
              </label>
              <span class="muted small">{fmtShort(o.date)} · {lessonName(o.lesson)}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if free}<p class="free">{free} – unterrichtsfrei</p>{/if}
    {#each lessons as lesson (lessonKey(lesson))}
      <LessonCard {date} {lesson} onedit={(l) => (dialog = { lesson: $state.snapshot(l) })} />
    {/each}
    {#if lessons.length === 0 && !free}
      {#if weekend}
        <div class="empty"><p>Wochenende, keine Stunden.</p></div>
      {:else if app.data.timetable.length === 0}
        <div class="empty">
          <p>Noch kein Stundenplan angelegt. Sobald er steht, erscheinen hier alle Stunden des Tages.</p>
          <button class="btn" onclick={() => (app.page = 'stundenplan')}>Zum Stundenplan</button>
        </div>
      {:else}
        <div class="empty"><p>An diesem Tag stehen keine Stunden im Plan.</p></div>
      {/if}
    {/if}
    <button class="link small extra" onclick={() => (dialog = { lesson: null })}><Plus size={14} /> Stunde nur für diesen Tag (z. B. Vertretung)</button>
  </div>

  <aside class="col">
    <GeneralTodos />
    <section class="card">
      <div class="card-head">
        <h2>Leistungsnachweise</h2>
        <span class="muted small">nächste 14 Tage</span>
      </div>
      {#if exams.length === 0}
        <p class="muted small">Keine angesetzt.</p>
      {:else}
        <ul class="exams">
          {#each exams as x (x.id)}
            {@const c = classOf(x.classId)}
            <li>
              <span class="dot" style:background={c?.color}></span>
              <span><strong>{c?.name ?? '–'}</strong> {x.type}{x.topic ? `: ${x.topic}` : ''}</span>
              <span class="muted small when">{relativeLabel(x.date) || fmtShort(x.date)}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </aside>
</div>

{#if dialog}
  <DayLessonDialog {date} lesson={dialog.lesson} onclose={() => (dialog = null)} />
{/if}

<style>
  header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.6rem;
  }
  .nav {
    display: flex;
    gap: 0.4rem;
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(290px, 1fr);
    gap: 1.25rem;
    align-items: start;
  }
  .col {
    display: grid;
    gap: 0.8rem;
  }
  aside.col {
    gap: 1.25rem;
  }
  .earlier {
    border-color: #ecd9bd;
    background: var(--warn-soft);
  }
  .earlier .card-head {
    margin-bottom: 0.5rem;
  }
  .earlier ul,
  .exams {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.25rem;
  }
  .earlier li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }
  .earlier label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .exams li {
    display: grid;
    grid-template-columns: 10px 1fr auto;
    align-items: center;
    gap: 0.6rem;
  }
  .exams .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--muted);
  }
  .free {
    padding: 0.7rem 1rem;
    border-radius: var(--radius);
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 500;
  }
  .extra {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--muted);
  }
  .when {
    white-space: nowrap;
  }
</style>
