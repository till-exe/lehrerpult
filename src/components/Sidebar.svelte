<script>
  import Lock from '@lucide/svelte/icons/lock';
  import { app, lockApp } from '../lib/store.svelte.js';
  import { PAGES, SETTINGS_PAGE } from '../lib/pages.js';
</script>

<nav>
  <div class="brand">Lehrerpult</div>

  <ul>
    {#each PAGES as p (p.id)}
      <li>
        <button class:active={app.page === p.id} onclick={() => (app.page = p.id)}>
          <p.icon size={18} strokeWidth={1.75} />
          {p.label}
        </button>
      </li>
    {/each}
  </ul>

  <div class="foot">
    <button class:active={app.page === SETTINGS_PAGE.id} onclick={() => (app.page = SETTINGS_PAGE.id)}>
      <SETTINGS_PAGE.icon size={18} strokeWidth={1.75} />
      {SETTINGS_PAGE.label}
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
  }
  .brand {
    font-weight: 650;
    font-size: 1.12rem;
    padding: 0 0.7rem 1.3rem;
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
  button.active {
    background: var(--accent-soft);
    color: var(--accent);
  }
  button.active :global(svg) {
    color: var(--accent);
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
