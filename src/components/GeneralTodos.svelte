<script>
  import X from '@lucide/svelte/icons/x';
  import { app } from '../lib/store.svelte.js';
  import { uid } from '../lib/classes.js';

  let draft = $state('');
  let showDone = $state(false);

  const open = $derived(app.data.todos.filter((t) => !t.done));
  const done = $derived(app.data.todos.filter((t) => t.done));

  function add(e) {
    if (e.key !== 'Enter' || !draft.trim()) return;
    app.data.todos.push({ id: uid(), text: draft.trim(), done: false });
    draft = '';
  }
  const remove = (id) => (app.data.todos = app.data.todos.filter((t) => t.id !== id));
</script>

<section class="card">
  <div class="card-head"><h2>Allgemeine To-dos</h2></div>
  {#if open.length === 0}<p class="muted small">Nichts offen.</p>{/if}
  <ul>
    {#each open as t (t.id)}
      <li>
        <label><input type="checkbox" bind:checked={t.done} /> <span>{t.text}</span></label>
        <button class="rm" aria-label="Löschen" onclick={() => remove(t.id)}><X size={14} /></button>
      </li>
    {/each}
  </ul>
  <input class="add" type="text" placeholder="+ To-do" bind:value={draft} onkeydown={add} />
  {#if done.length}
    <button class="link small toggle" onclick={() => (showDone = !showDone)}>
      {showDone ? 'Erledigte ausblenden' : `Erledigt (${done.length})`}
    </button>
    {#if showDone}
      <ul>
        {#each done as t (t.id)}
          <li class="done">
            <label><input type="checkbox" bind:checked={t.done} /> <span>{t.text}</span></label>
            <button class="rm" aria-label="Löschen" onclick={() => remove(t.id)}><X size={14} /></button>
          </li>
        {/each}
      </ul>
      <button class="link small" onclick={() => (app.data.todos = open)}>Erledigte löschen</button>
    {/if}
  {/if}
</section>

<style>
  section {
    display: grid;
    gap: 0.4rem;
  }
  .card-head {
    margin-bottom: 0.3rem;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.15rem;
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
    padding: 0.3rem 0.5rem;
    margin-left: -0.5rem;
    font-size: 0.9rem;
  }
  .add:hover {
    border-color: var(--line);
  }
  .toggle {
    justify-self: start;
    margin-top: 0.4rem;
  }
</style>
