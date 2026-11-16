<script>
  import X from '@lucide/svelte/icons/x';
  import Pencil from '@lucide/svelte/icons/pencil';
  import { app } from '../lib/store.svelte.js';
  import { selectClass } from '../lib/classes.js';
  import { autosize } from '../lib/autosize.js';
  import { fmtShort } from '../lib/dates.js';
  import { classOf, lessonName, lessonKey, periodLabel, timeRange, setNote, addTodo, toggleTodo, removeTodo, previousLesson } from '../lib/timetable.js';

  import { examsOn } from '../lib/exams.js';

  let { date, lesson, onedit } = $props();
  let draft = $state('');

  const key = $derived(lessonKey(lesson));
  const klass = $derived(classOf(lesson.classId));
  const prev = $derived(lesson.classId ? previousLesson(lesson.classId, date, lesson.period) : null);

  function onTodoKey(e) {
    if (e.key === 'Enter' && draft.trim()) {
      addTodo(date, key, draft);
      draft = '';
    }
  }

  function open(page) {
    selectClass(lesson.classId);
    app.page = page;
  }
</script>

<article style:--c={klass?.color ?? 'var(--line-strong)'} class:cancelled={lesson.cancelled}>
  <div class="time">
    <strong>{periodLabel(lesson.period, lesson.length)}</strong>
    <span>{timeRange(lesson.period, lesson.length)}</span>
  </div>
  <div class="body">
    <div class="head">
      <strong class="name">{lessonName(lesson)}</strong>
      <span class="muted">{[lesson.subject, lesson.room].filter(Boolean).join(' · ')}</span>
      {#each lesson.classId ? examsOn(date, lesson.classId) : [] as x (x.id)}<span class="tag exam" title={x.note}>{x.type}{x.topic ? `: ${x.topic}` : ''}</span>{/each}
      {#if lesson.cancelled}<span class="tag warn">entfällt</span>
      {:else if lesson.orphan}<span class="tag warn">nicht mehr im Stundenplan</span>
      {:else if lesson.extra}<span class="tag">nur an diesem Tag</span>
      {:else if lesson.changed}<span class="tag">geändert</span>{/if}
      <span class="links">
        {#if klass && !lesson.cancelled}<button class="link small" onclick={() => open('muendlich')}>Mündlich</button>{/if}
        <button class="edit" title="Nur für diesen Tag ändern" aria-label="Stunde an diesem Tag ändern" onclick={() => onedit(lesson)}><Pencil size={14} /></button>
      </span>
    </div>
    {#if !lesson.cancelled || lesson.note || lesson.todos.length}
      <textarea rows="1" placeholder="Kurzbeschreibung" value={lesson.note} oninput={(e) => setNote(date, key, e.currentTarget.value)} use:autosize={lesson.note}></textarea>
      {#if lesson.todos.length}
        <ul>
          {#each lesson.todos as t (t.id)}
            <li class:done={t.done}>
              <label><input type="checkbox" checked={t.done} onchange={() => toggleTodo(date, key, t.id)} /> <span>{t.text}</span></label>
              <button class="rm" aria-label="To-do löschen" onclick={() => removeTodo(date, key, t.id)}><X size={14} /></button>
            </li>
          {/each}
        </ul>
      {/if}
      <input class="add" type="text" placeholder="+ To-do" bind:value={draft} onkeydown={onTodoKey} />
    {/if}
    {#if prev && !lesson.cancelled}
      <button class="prev" title="Zum Stundenverlauf der Klasse" onclick={() => ((app.jump = { classTab: 'stunden' }), open('klasse'))}>
        <span class="muted">Letzte Stunde ({fmtShort(prev.date)}):</span> {prev.lesson.note}
      </button>
    {/if}
  </div>
</article>

<style>
  article {
    display: grid;
    grid-template-columns: 110px 1fr;
    border: 1px solid var(--line);
    border-left: 4px solid var(--c);
    border-radius: var(--radius);
    background: #fff;
  }
  article.cancelled {
    background: var(--bg-soft);
    border-left-color: var(--line-strong);
  }
  article.cancelled .name {
    text-decoration: line-through;
    color: var(--muted);
  }
  .time {
    padding: 0.9rem 0.6rem 0.9rem 0.9rem;
    display: grid;
    align-content: start;
    gap: 0.1rem;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .time strong {
    color: var(--text);
    font-size: 0.9rem;
  }
  .body {
    padding: 0.8rem 1rem 0.8rem 0;
    display: grid;
    gap: 0.45rem;
    min-width: 0;
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
  }
  .name {
    font-size: 1.02rem;
  }
  .tag {
    font-size: 0.76rem;
    font-weight: 600;
    padding: 0.05rem 0.5rem;
    border-radius: 999px;
    background: var(--bg-side);
    color: var(--muted);
  }
  .tag.exam {
    background: var(--accent);
    color: #fff;
  }
  .tag.warn {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .links {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .edit {
    border: none;
    background: none;
    color: var(--muted);
    padding: 0.2rem;
    border-radius: 5px;
    display: flex;
  }
  .edit:hover {
    background: var(--bg-side);
    color: var(--text);
  }
  textarea {
    border: 1px solid transparent;
    background: var(--bg-soft);
    resize: none;
    padding: 0.45rem 0.6rem;
    min-height: 2.3rem;
    overflow: hidden;
  }
  textarea:hover {
    border-color: var(--line);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.1rem;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  li label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  li.done span {
    color: var(--muted);
    text-decoration: line-through;
  }
  .rm {
    border: none;
    background: none;
    color: var(--muted);
    opacity: 0;
    padding: 0.2rem;
  }
  li:hover .rm {
    opacity: 1;
  }
  .add {
    border: 1px solid transparent;
    padding: 0.3rem 0.6rem;
    font-size: 0.9rem;
    color: var(--muted);
  }
  .add:hover {
    border-color: var(--line);
  }
  .add:focus {
    color: var(--text);
  }
  .prev {
    border: none;
    background: none;
    padding: 0 0.6rem;
    text-align: left;
    font-size: 0.86rem;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .prev:hover {
    text-decoration: underline;
  }
</style>
