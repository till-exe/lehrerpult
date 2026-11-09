<script>
  let { page } = $props();
</script>

<h1>{page.label}</h1>

<section class="card">
  <div class="card-head">
    <h2>Geplant</h2>
    <span class="badge">Schritt {page.step}</span>
  </div>
  <ul>
    {#each page.plan as item}
      <li>{item}</li>
    {/each}
  </ul>
</section>

<style>
  h1 {
    margin-bottom: 1.6rem;
  }
  section {
    max-width: 640px;
  }
  ul {
    margin: 0;
    padding-left: 1.2rem;
    display: grid;
    gap: 0.35rem;
  }
</style>
