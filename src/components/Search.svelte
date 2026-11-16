<script>
  import SearchIcon from '@lucide/svelte/icons/search';
  import { search } from '../lib/search.js';

  let query = $state('');
  let open = $state(false);
  let input;
  const groups = $derived(open ? search(query) : []);

  function pick(item) {
    item.run();
    query = '';
    open = false;
    input.blur();
  }

  function onKey(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="search">
  <SearchIcon size={15} />
  <input
    bind:this={input}
    type="text"
    placeholder="Suchen"
    title="Suchen (Strg+K)"
    bind:value={query}
    onfocus={() => (open = true)}
    onblur={() => setTimeout(() => (open = false), 150)}
    onkeydown={(e) => {
      if (e.key === 'Escape') (query = ''), input.blur();
      if (e.key === 'Enter' && groups[0]) pick(groups[0].items[0]);
    }}
  />
  {#if open && query.trim().length >= 2}
    <div class="results">
      {#each groups as g}
        <p class="group">{g.title}</p>
        {#each g.items as item}
          <button onmousedown={(e) => e.preventDefault()} onclick={() => pick(item)}>
            <span class="label">{item.label}</span>
            {#if item.sub}<span class="sub">{item.sub}</span>{/if}
          </button>
        {/each}
      {:else}
        <p class="none">Nichts gefunden.</p>
      {/each}
    </div>
  {/if}
</div>

<style>
  .search {
    position: relative;
    display: flex;
    align-items: center;
    margin: 0 0.2rem 0.9rem;
  }
  .search > :global(svg) {
    position: absolute;
    left: 0.6rem;
    color: var(--muted);
    pointer-events: none;
  }
  input {
    padding: 0.4rem 0.6rem 0.4rem 1.9rem;
    font-size: 0.92rem;
    border-color: var(--line);
    background: #fff;
  }
  .results {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 380px;
    max-height: 70vh;
    overflow: auto;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 0.4rem;
    z-index: 40;
  }
  .group {
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--muted);
    padding: 0.5rem 0.6rem 0.2rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .results button {
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 0.8rem;
    border: none;
    background: none;
    padding: 0.4rem 0.6rem;
    border-radius: var(--radius-sm);
    text-align: left;
    color: var(--text);
  }
  .results button:hover {
    background: var(--accent-soft);
  }
  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    color: var(--muted);
    font-size: 0.85rem;
    white-space: nowrap;
  }
  .none {
    padding: 0.6rem;
    color: var(--muted);
  }
</style>
