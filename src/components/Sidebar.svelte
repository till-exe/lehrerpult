<script>
  import Lock from '@lucide/svelte/icons/lock';
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import TimerIcon from '@lucide/svelte/icons/timer';
  import { app, lockApp, undo } from '../lib/store.svelte.js';
  import { sortedClasses, currentClass, selectClass } from '../lib/classes.js';
  import { timer, mmss } from '../lib/timer.svelte.js';
  import { PAGES, SETTINGS_PAGE } from '../lib/pages.js';
  import Search from './Search.svelte';

  // Strg+Z macht die letzte Änderung rückgängig, außer beim Tippen in einem Textfeld.
  function onKey(e) {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z' || e.shiftKey) return;
    if (e.target.closest?.('input, textarea, select')) return;
    e.preventDefault();
    undo();
  }

  // Klassenliste unter „Klasse“, auf- und zuklappbar (wird gespeichert).
  const classesOpen = $derived(app.data.settings.navClassesOpen ?? true);
  const current = $derived(currentClass());

  function openClass(c) {
    selectClass(c.id);
    if (app.page !== 'klasse') goTo('klasse'); // auf der Klassenseite bleibt der offene Reiter erhalten
  }

  function goTo(id) {
    app.page = id;
    app.navKey++;
  }
</script>

<svelte:window onkeydown={onKey} />

<nav>
  <div class="brand">Lehrerpult</div>
  <Search />

  <ul>
    {#each PAGES as p (p.id)}
      <li>
        {#if p.id === 'klasse'}
          <div class="row">
            <button class:active={app.page === 'klasse' && !classesOpen} onclick={() => goTo('klasse')}>
              <p.icon size={18} strokeWidth={1.75} />
              {p.label}
            </button>
            {#if app.data.classes.length}
              <button class="toggle" aria-label={classesOpen ? 'Klassen einklappen' : 'Klassen ausklappen'} title={classesOpen ? 'Klassen einklappen' : 'Klassen ausklappen'} onclick={() => (app.data.settings.navClassesOpen = !classesOpen)}>
                {#if classesOpen}<ChevronDown size={16} />{:else}<ChevronRight size={16} />{/if}
              </button>
            {/if}
          </div>
          {#if classesOpen && app.data.classes.length}
            <ul class="classes">
              {#each sortedClasses() as c (c.id)}
                <li>
                  <button class:active={app.page === 'klasse' && current?.id === c.id} onclick={() => openClass(c)}>
                    <span class="dot" style:background={c.color}></span>
                    {c.name}
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        {:else}
          <button class:active={app.page === p.id} onclick={() => goTo(p.id)}>
            <p.icon size={18} strokeWidth={1.75} />
            {p.label}
          </button>
        {/if}
      </li>
    {/each}
  </ul>

  <div class="foot">
    {#if timer.running || timer.finished}
      <button class="timer" class:done={timer.finished} title="Zum Timer" onclick={() => goTo('unterricht')}>
        <TimerIcon size={18} strokeWidth={1.75} />
        {timer.finished ? 'Zeit ist um' : timer.mode === 'stoppuhr' ? mmss(timer.elapsed) : mmss(timer.remaining)}
      </button>
    {/if}
    <button class:active={app.page === SETTINGS_PAGE.id} onclick={() => goTo(SETTINGS_PAGE.id)}>
      <SETTINGS_PAGE.icon size={18} strokeWidth={1.75} />
      {SETTINGS_PAGE.label}
    </button>
    <button onclick={undo} disabled={app.undoCount === 0} title="Letzte Änderung rückgängig machen (Strg+Z)">
      <Undo2 size={18} strokeWidth={1.75} />
      Rückgängig
    </button>
    <button onclick={lockApp}>
      <Lock size={18} strokeWidth={1.75} />
      Sperren
    </button>
    <p class="save small" class:error={app.saveState === 'error'} title={app.saveError}>
      {#if app.saveState === 'error'}
        Speichern fehlgeschlagen
      {:else if app.saveState === 'pending'}
        Wird gespeichert …
      {:else}
        Alles gespeichert
      {/if}
    </p>
  </div>
</nav>

<style>
  nav {
    background: var(--bg-side);
    border-right: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    padding: 1.3rem 0.8rem 1rem;
    min-height: 0;
    overflow: auto;
  }
  .brand {
    font-weight: 650;
    font-size: 1.12rem;
    padding: 0 0.7rem 0.9rem;
    letter-spacing: -0.01em;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
  }
  button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.55rem 0.7rem;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text);
    text-align: left;
    font-weight: 500;
  }
  button :global(svg) {
    color: var(--muted);
    flex: none;
  }
  button:hover {
    background: #eaece8;
  }
  button:disabled {
    opacity: 0.4;
    background: transparent;
    cursor: default;
  }
  button.active {
    background: var(--accent-soft);
    color: var(--accent);
  }
  button.active :global(svg) {
    color: var(--accent);
  }
  .row {
    display: flex;
    align-items: center;
  }
  .row > button:first-child {
    flex: 1;
  }
  .toggle {
    width: auto;
    padding: 0.45rem;
  }
  .classes {
    margin: 1px 0 4px;
  }
  .classes button {
    padding: 0.32rem 0.7rem 0.32rem 2.35rem;
    font-weight: 450;
    font-size: 0.93rem;
    gap: 0.55rem;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: none;
  }
  .timer {
    background: var(--accent-soft);
    color: var(--accent);
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    margin-bottom: 0.3rem;
  }
  .timer :global(svg) {
    color: var(--accent);
  }
  .timer.done {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .foot {
    margin-top: auto;
    display: grid;
    gap: 2px;
    border-top: 1px solid var(--line);
    padding-top: 0.8rem;
  }
  .save {
    color: var(--muted);
    padding: 0.6rem 0.7rem 0;
  }
  .save.error {
    color: var(--danger);
  }
</style>
