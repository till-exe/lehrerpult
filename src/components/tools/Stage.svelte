<script>
  import Maximize from '@lucide/svelte/icons/maximize';
  import Minimize from '@lucide/svelte/icons/minimize';

  // Rahmen für ein Werkzeug, mit Vollbild für den Beamer.
  let { children } = $props();
  let el;
  let full = $state(false);

  function toggle() {
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }
</script>

<svelte:document onfullscreenchange={() => (full = document.fullscreenElement === el)} />

<div class="stage" class:full bind:this={el}>
  <button class="btn ghost fs" onclick={toggle} title={full ? 'Vollbild beenden (Esc)' : 'Vollbild für den Beamer'}>
    {#if full}<Minimize size={18} /> Beenden{:else}<Maximize size={18} /> Vollbild{/if}
  </button>
  {@render children()}
</div>

<style>
  .stage {
    position: relative;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: #fff;
    padding: 2rem;
    min-height: 460px;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 1.4rem;
  }
  .stage.full {
    border: none;
    border-radius: 0;
    padding: 3rem;
    font-size: 1.3rem;
  }
  .fs {
    position: absolute;
    top: 0.8rem;
    right: 0.8rem;
    color: var(--muted);
    font-size: 0.9rem;
  }
</style>
