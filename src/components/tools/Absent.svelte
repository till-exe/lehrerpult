<script>
  import { session } from '../../lib/session.svelte.js';

  // Abwesende für diese Sitzung ausschließen.
  let { students } = $props();
  let open = $state(false);
  const count = $derived(students.filter((s) => session.absent[s.id]).length);
</script>

<details bind:open>
  <summary>Abwesend{count ? ` (${count})` : ''}</summary>
  <div class="chips">
    {#each students as s (s.id)}
      <button class:off={session.absent[s.id]} onclick={() => (session.absent[s.id] = !session.absent[s.id])}>
        {s.firstName} {s.lastName.slice(0, 1)}.
      </button>
    {/each}
  </div>
</details>

<style>
  details {
    width: 100%;
    max-width: 900px;
    margin-bottom: 0.8rem;
  }
  summary {
    cursor: pointer;
    color: var(--muted);
    font-weight: 500;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.6rem;
  }
  button {
    border: 1px solid var(--line-strong);
    background: #fff;
    border-radius: 999px;
    padding: 0.15rem 0.65rem;
    font-size: 0.85rem;
  }
  button.off {
    background: var(--bg-side);
    color: var(--muted);
    text-decoration: line-through;
  }
</style>
