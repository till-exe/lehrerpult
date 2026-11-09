<script>
  let { title, onclose, children, actions, wide = false } = $props();
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose?.()} />

<div class="backdrop" role="presentation" onclick={(e) => e.target === e.currentTarget && onclose?.()}>
  <div class="dialog" class:wide role="dialog" aria-modal="true" aria-label={title}>
    <h2>{title}</h2>
    <div class="body">{@render children()}</div>
    {#if actions}<div class="actions">{@render actions()}</div>{/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(20, 28, 25, 0.28);
    display: grid;
    place-items: center;
    z-index: 50;
  }
  .dialog {
    background: #fff;
    border-radius: 12px;
    box-shadow: var(--shadow);
    width: min(460px, calc(100vw - 2rem));
    padding: 1.5rem;
    display: grid;
    gap: 1rem;
  }
  .dialog.wide {
    width: min(820px, calc(100vw - 2rem));
  }
  .body {
    display: grid;
    gap: 0.8rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
