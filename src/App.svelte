<script>
  import { onMount } from 'svelte';
  import { api } from './lib/api.js';
  import { app, load, changed, flush, lockApp } from './lib/store.svelte.js';
  import { PAGES } from './lib/pages.js';
  import Sidebar from './components/Sidebar.svelte';
  import Setup from './screens/Setup.svelte';
  import Lock from './screens/Lock.svelte';
  import Start from './pages/Start.svelte';
  import Settings from './pages/Settings.svelte';
  import Placeholder from './pages/Placeholder.svelte';

  onMount(async () => {
    const status = await api.status();
    app.config = status.config;
    app.version = status.version;
    if (!status.exists) return (app.phase = 'setup');
    const res = await api.autoUnlock();
    if (res.ok) load(res.data);
    else app.phase = 'locked';
  });

  // Jede Änderung an den Daten wird automatisch gespeichert.
  $effect(() => {
    if (app.phase === 'ready' && app.data) changed(JSON.stringify(app.data));
  });

  // Laptop gesperrt oder Fenster wird geschlossen.
  onMount(() => {
    const offLock = api.onLockNow(() => app.phase === 'ready' && lockApp());
    const offClose = api.onFlushAndClose(async () => {
      await flush();
      api.readyToClose();
    });
    return () => (offLock(), offClose());
  });

  // Sperre nach Inaktivität (in den Einstellungen wählbar).
  let lastActivity = Date.now();
  const touch = () => (lastActivity = Date.now());
  onMount(() => {
    const id = setInterval(() => {
      const minutes = app.config?.idleMinutes ?? 0;
      if (minutes > 0 && app.phase === 'ready' && Date.now() - lastActivity > minutes * 60000) lockApp();
    }, 15000);
    return () => clearInterval(id);
  });

  const current = $derived(PAGES.find((p) => p.id === app.page));
</script>

<svelte:window onmousemove={touch} onkeydown={touch} onmousedown={touch} />

{#if app.phase === 'setup'}
  <Setup />
{:else if app.phase === 'locked'}
  <Lock />
{:else if app.phase === 'ready'}
  <div class="shell">
    <Sidebar />
    <main>
      {#if app.page === 'start'}
        <Start />
      {:else if app.page === 'einstellungen'}
        <Settings />
      {:else if current}
        {#key current.id}
          <Placeholder page={current} />
        {/key}
      {/if}
    </main>
  </div>
{/if}

<style>
  .shell {
    display: grid;
    grid-template-columns: 236px 1fr;
    height: 100%;
  }
  main {
    overflow: auto;
    padding: 2.2rem 2.6rem 3rem;
  }
</style>
