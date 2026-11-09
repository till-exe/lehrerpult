<script>
  import Copy from '@lucide/svelte/icons/copy';
  import Check from '@lucide/svelte/icons/check';

  let { code } = $props();
  let copied = $state(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="code">
  <span>{code}</span>
  <button class="btn ghost icon" aria-label="Kopieren" title="Kopieren" onclick={copy}>
    {#if copied}<Check size={18} />{:else}<Copy size={18} />{/if}
  </button>
</div>

<style>
  .code {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.7rem 0.9rem;
    border-radius: var(--radius-sm);
    background: var(--bg-soft);
    border: 1px solid var(--line);
    font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
    font-size: 1.05rem;
    letter-spacing: 0.04em;
  }
</style>
