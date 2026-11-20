<script>
  import { onMount } from 'svelte';
  import { api } from './lib/api.js';
  import { app, load, changed, flush, lockApp } from './lib/store.svelte.js';
  import { timer } from './lib/timer.svelte.js';
  import Sidebar from './components/Sidebar.svelte';
  import Setup from './screens/Setup.svelte';
  import Lock from './screens/Lock.svelte';
  import Start from './pages/Start.svelte';
  import Klasse from './pages/Klasse.svelte';
  import Kalender from './pages/Kalender.svelte';
  import Muendlich from './pages/Muendlich.svelte';
  import Leistungsnachweise from './pages/Leistungsnachweise.svelte';
  import Stundenplan from './pages/Stundenplan.svelte';
  import Unterricht from './pages/Unterricht.svelte';
  import Notizen from './pages/Notizen.svelte';

  const VIEWS = { start: Start, kalender: Kalender, klasse: Klasse, muendlich: Muendlich, leistungsnachweise: Leistungsnachweise, stundenplan: Stundenplan, unterricht: Unterricht, notizen: Notizen, einstellungen: Settings };
  import Settings from './pages/Settings.svelte';

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
      if (minutes > 0 && app.phase === 'ready' && !timer.running && Date.now() - lastActivity > minutes * 60000) lockApp();
    }, 15000);
    return () => clearInterval(id);
  });

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
      {#if VIEWS[app.page]}
        {@const View = VIEWS[app.page]}
        {#key app.navKey}<View />{/key}
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
