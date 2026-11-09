<script>
  import X from '@lucide/svelte/icons/x';
  import { app } from '../lib/store.svelte.js';
  import { selectClass } from '../lib/classes.js';
  import { autosize } from '../lib/autosize.js';
  import { classOf, lessonName, periodLabel, timeRange, setNote, addTodo, toggleTodo, removeTodo } from '../lib/timetable.js';

  let { date, lesson, index } = $props();
  let draft = $state('');

  const klass = $derived(classOf(lesson.classId));

  function onTodoKey(e) {
    if (e.key === 'Enter' && draft.trim()) {
      addTodo(date, index, draft);
      draft = '';
    }
  }

  function openOral() {
    selectClass(lesson.classId);
    app.page = 'muendlich';
  }
</script>

<article style:--c={klass?.color ?? 'var(--line-strong)'}>
  <div class="time">
    <strong>{periodLabel(lesson.period, lesson.length)}</strong>
    <span>{timeRange(lesson.period, lesson.length)}</span>
  </div>
  <div class="body">
    <div class="head">
      <strong>{lessonName(lesson)}</strong>
      <span class="muted">{[lesson.subject, lesson.room].filter(Boolean).join(' · ')}</span>
      {#if klass}<button class="link small oral" onclick={openOral}>Mündlich eintragen</button>{/if}
    </div>
    <textarea
      rows="1"
      placeholder="Kurzbeschreibung: Thema, Material, Hausaufgabe …"
      value={lesson.note}
      oninput={(e) => setNote(date, index, e.currentTarget.value)}
      use:autosize={lesson.note}
    ></textarea>
    {#if lesson.todos.length}
      <ul>
        {#each lesson.todos as t (t.id)}
          <li class:done={t.done}>
            <label><input type="checkbox" checked={t.done} onchange={() => toggleTodo(date, index, t.id)} /> <span>{t.text}</span></label>
            <button class="rm" aria-label="To-do löschen" onclick={() => removeTodo(date, index, t.id)}><X size={14} /></button>
          </li>
        {/each}
      </ul>
    {/if}
    <input class="add" type="text" placeholder="+ To-do (Enter)" bind:value={draft} onkeydown={onTodoKey} />
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
  .head strong {
    font-size: 1.02rem;
  }
  .oral {
    margin-left: auto;
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
</style>
