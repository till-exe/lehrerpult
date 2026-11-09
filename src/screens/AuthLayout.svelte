<script>
  let { children } = $props();
</script>

<div class="wrap">
  <div class="card panel">
    <p class="brand">Lehrerpult</p>
    {@render children()}
  </div>
</div>

<style>
  .wrap {
    min-height: 100%;
    display: grid;
    place-items: center;
    background: var(--bg-side);
    padding: 2rem;
  }
  .panel {
    width: min(460px, 100%);
    padding: 2rem 2.1rem;
    box-shadow: var(--shadow);
    display: grid;
    gap: 1.1rem;
  }
  .brand {
    font-weight: 650;
    color: var(--accent);
    font-size: 0.95rem;
  }
</style>
