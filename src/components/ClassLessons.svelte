<script>
  import { tick } from 'svelte';
  import { app } from '../lib/store.svelte.js';
  import { today, addDays, fmtShort } from '../lib/dates.js';
  import { autosize } from '../lib/autosize.js';
  import { classLessons, lessonKey, periodLabel, setNote } from '../lib/timetable.js';
  import { examsOn } from '../lib/exams.js';

  let { klass } = $props();
  let back = $state(28);
  let ahead = $state(42);
  let root;

  const now = today();
  const rows = $derived(classLessons(klass.id, addDays(now, -back), addDays(now, ahead)));
  const firstUpcoming = $derived(rows.find((r) => r.date >= now));

  $effect(() => {
    // Beim Öffnen zur nächsten Stunde springen.
    tick().then(() => root?.querySelector('.next')?.scrollIntoView({ block: 'center' }));
  });
</script>

<div class="wrap" bind:this={root}>
  <p class="muted small intro">Was in welcher Stunde dran war und was geplant ist. Das Thema ist dieselbe Kurzbeschreibung wie auf der Startseite. Leistungsnachweise der Klasse sind markiert.</p>
  <button class="link small" onclick={() => (back += 28)}>Frühere Stunden anzeigen</button>

  {#if rows.length === 0}
    <div class="empty">
      <p>Für {klass.name} stehen in diesem Zeitraum keine Stunden im Stundenplan.</p>
      <button class="btn" onclick={() => (app.page = 'stundenplan')}>Zum Stundenplan</button>
    </div>
  {:else}
    <ul>
      {#each rows as r (r.date + lessonKey(r.lesson))}
        {@const l = r.lesson}
        <li class:past={r.date < now} class:today={r.date === now} class:next={r === firstUpcoming} class:cancelled={l.cancelled}>
          <span class="date">{fmtShort(r.date)}{#if r.date === now}<span class="badge">heute</span>{/if}</span>
          <span class="period muted">{periodLabel(l.period, l.length)}</span>
          {#if l.cancelled}
            <span class="muted">entfällt</span>
          {:else}
            <span class="topic">
              {#each examsOn(r.date, klass.id) as x (x.id)}<span class="exam" title={x.note}>{x.type}{x.topic ? `: ${x.topic}` : ''}</span>{/each}
              <textarea rows="1" aria-label="Thema" value={l.note} oninput={(e) => setNote(r.date, lessonKey(l), e.currentTarget.value)} use:autosize={l.note}></textarea>
            </span>
          {/if}
          <span class="todos muted small">{#if l.todos.length}{l.todos.filter((t) => !t.done).length}/{l.todos.length} To-dos offen{/if}</span>
        </li>
      {/each}
    </ul>
  {/if}
  <button class="link small" onclick={() => (ahead += 42)}>Weitere Stunden anzeigen</button>
</div>

<style>
  .wrap {
    display: grid;
    gap: 0.7rem;
    max-width: 980px;
    justify-items: start;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
    border-top: 1px solid var(--line);
  }
  li {
    display: grid;
    grid-template-columns: 130px 100px 1fr 120px;
    align-items: center;
    gap: 0.8rem;
    padding: 0.3rem 0.4rem;
    border-bottom: 1px solid var(--line);
  }
  li.today {
    background: var(--accent-soft);
  }
  li.past .date {
    color: var(--muted);
  }
  .date {
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .period {
    font-size: 0.88rem;
  }
  .topic {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }
  .exam {
    flex: none;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.1rem 0.55rem;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    max-width: 45%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  textarea {
    border-color: transparent;
    background: transparent;
    resize: none;
    padding: 0.35rem 0.5rem;
    min-height: 2.1rem;
    overflow: hidden;
  }
  li:not(.today) textarea {
    background: var(--bg-soft);
  }
  li.today textarea {
    background: #fff;
  }
  textarea:hover {
    border-color: var(--line);
  }
  .todos {
    text-align: right;
  }
</style>
