<script>
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { app } from '../lib/store.svelte.js';

  let offset = $state(0);
  const day = $derived(new Date(Date.now() + offset * 86400000));
  const title = $derived(new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(day));
  const label = $derived(offset === 0 ? 'Heute' : offset === 1 ? 'Morgen' : offset === -1 ? 'Gestern' : '');
</script>

<header>
  <div>
    <p class="muted">{label || ' '}</p>
    <h1>{title}</h1>
  </div>
  <div class="nav">
    <button class="btn icon" aria-label="Vorheriger Tag" onclick={() => offset--}><ChevronLeft size={18} /></button>
    <button class="btn" disabled={offset === 0} onclick={() => (offset = 0)}>Heute</button>
    <button class="btn icon" aria-label="Nächster Tag" onclick={() => offset++}><ChevronRight size={18} /></button>
  </div>
</header>

<div class="grid">
  <section class="card">
    <div class="card-head"><h2>Stunden</h2></div>
    <div class="empty">
      <p>Noch kein Stundenplan angelegt. Sobald er steht, erscheinen hier alle Stunden des Tages mit Platz für Kurzbeschreibung und To-dos.</p>
      <button class="btn" onclick={() => (app.page = 'stundenplan')}>Zum Stundenplan</button>
    </div>
  </section>

  <aside>
    <section class="card">
      <div class="card-head"><h2>Allgemeine To-dos</h2></div>
      <div class="empty"><p class="small">Kommt mit Schritt 4.</p></div>
    </section>
    <section class="card">
      <div class="card-head"><h2>Anstehende Leistungsnachweise</h2></div>
      <div class="empty"><p class="small">Kommt mit Schritt 6.</p></div>
    </section>
  </aside>
</div>

<style>
  header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.8rem;
  }
  .nav {
    display: flex;
    gap: 0.4rem;
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr);
    gap: 1.25rem;
    align-items: start;
  }
  aside {
    display: grid;
    gap: 1.25rem;
  }
</style>
