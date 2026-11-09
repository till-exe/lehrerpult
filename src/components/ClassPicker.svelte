<script>
  import { app } from '../lib/store.svelte.js';
  import { sortedClasses, currentClass, selectClass } from '../lib/classes.js';

  const current = $derived(currentClass());
</script>

{#if app.data.classes.length > 0}
  <label class="picker">
    <span class="dot" style:background={current?.color}></span>
    <select value={current?.id} onchange={(e) => selectClass(e.currentTarget.value)} aria-label="Klasse wählen">
      {#each sortedClasses() as c (c.id)}
        <option value={c.id}>{c.name}{c.subject ? ` · ${c.subject}` : ''}</option>
      {/each}
    </select>
  </label>
{/if}

<style>
  .picker {
    position: relative;
    display: inline-flex;
    align-items: center;
  }
  .dot {
    position: absolute;
    left: 0.75rem;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    pointer-events: none;
  }
  select {
    padding-left: 1.9rem;
    min-width: 200px;
    font-weight: 500;
  }
</style>
