<script>
  import { onMount } from 'svelte';
  import { api } from '../lib/api.js';
  import { app, load, flush } from '../lib/store.svelte.js';
  import { PAGES } from '../lib/pages.js';
  import Modal from '../components/Modal.svelte';
  import RecoveryCode from '../components/RecoveryCode.svelte';
  import YearDialog from '../components/YearDialog.svelte';

  const KIND = { taeglich: 'Tagesstand', monatlich: 'Monatsstand', archiv: 'Archiv', 'vor-update': 'vor Update' };
  // Archive immer zeigen, dazu die neuesten übrigen Stände.
  const shown = $derived([...backups.filter((b) => b.kind === 'archiv'), ...backups.filter((b) => b.kind !== 'archiv').slice(0, 8)]);

  let backups = $state([]);
  let notice = $state('');
  let dialog = $state(null); // password | code | restore
  let form = $state({ old: '', pw: '', pw2: '', error: '', code: '' });
  let restoreTarget = $state(null);

  const fmt = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Updates: nur wenn du auf den Knopf drückst.
  let update = $state({ phase: 'idle', latest: '', percent: 0, error: '' }); // idle | checking | none | available | loading | ready | error
  onMount(() => api.onUpdateProgress((p) => (update.percent = p)));

  async function checkUpdate() {
    update = { phase: 'checking', latest: '', percent: 0, error: '' };
    const res = await api.checkUpdate();
    if (!res.ok) update = { ...update, phase: 'error', error: res.error ?? 'Die Suche ist fehlgeschlagen. Besteht eine Internetverbindung?' };
    else update = { ...update, phase: res.available ? 'available' : 'none', latest: res.latest ?? '' };
  }

  async function downloadUpdate() {
    update.phase = 'loading';
    const res = await api.downloadUpdate();
    if (res.ok) update.phase = 'ready';
    else update = { ...update, phase: 'error', error: res.error ?? 'Der Download ist fehlgeschlagen.' };
  }

  async function installUpdate() {
    await flush();
    api.installUpdate();
  }

  async function refresh() {
    const res = await api.listBackups();
    backups = res.items ?? [];
  }
  onMount(refresh);

  function flash(text) {
    notice = text;
    setTimeout(() => (notice = ''), 3000);
  }

  async function setConfig(patch) {
    const res = await api.setConfig(patch);
    if (res.ok) app.config = res.config;
  }

  function openDialog(name) {
    form = { old: '', pw: '', pw2: '', error: '', code: '' };
    dialog = name;
  }

  async function changePassword() {
    if (form.pw.length < 8) return (form.error = 'Bitte mindestens 8 Zeichen verwenden.');
    if (form.pw !== form.pw2) return (form.error = 'Die beiden Passwörter stimmen nicht überein.');
    const res = await api.changePassword(form.old, form.pw);
    if (!res.ok) return (form.error = res.error);
    dialog = null;
    flash('Passwort geändert.');
  }

  async function newCode() {
    const res = await api.newRecoveryCode(form.old);
    if (!res.ok) return (form.error = res.error);
    form.code = res.recoveryCode;
  }

  async function backupNow() {
    const res = await api.backupNow();
    flash(res.ok ? 'Sicherung erstellt.' : `Nicht alle Ordner erreichbar: ${res.error}`);
    refresh();
  }

  async function chooseExtra() {
    const res = await api.chooseExtraBackupDir();
    if (res.ok) app.config = res.config;
  }

  async function restore() {
    const res = await api.restoreBackup(restoreTarget.path);
    dialog = null;
    if (!res.ok) return flash(res.error);
    load(res.data);
    app.page = 'einstellungen';
    flash('Sicherung wiederhergestellt. Der vorherige Stand wurde zusätzlich gesichert.');
  }
</script>

<h1>Einstellungen</h1>

{#if notice}<p class="notice">{notice}</p>{/if}

<div class="stack">
  <section class="card">
    <div class="card-head"><h2>Sicherheit</h2></div>

    <fieldset>
      <legend>Passwort abfragen</legend>
      <label class="radio">
        <input type="radio" name="lock" checked={app.config.lockMode === 'sperre'} onchange={() => setConfig({ lockMode: 'sperre' })} />
        <span>Nur wenn der Laptop oder die App gesperrt war</span>
      </label>
      <label class="radio">
        <input type="radio" name="lock" checked={app.config.lockMode === 'start'} onchange={() => setConfig({ lockMode: 'start' })} />
        <span>Zusätzlich bei jedem Start</span>
      </label>
    </fieldset>

    <label class="field inline">
      Automatisch sperren
      <select value={app.config.idleMinutes} onchange={(e) => setConfig({ idleMinutes: Number(e.currentTarget.value) })}>
        <option value={0}>Nie</option>
        <option value={10}>Nach 10 Minuten ohne Benutzung</option>
        <option value={20}>Nach 20 Minuten ohne Benutzung</option>
        <option value={30}>Nach 30 Minuten ohne Benutzung</option>
        <option value={60}>Nach 60 Minuten ohne Benutzung</option>
      </select>
    </label>

    <div class="buttons">
      <button class="btn" onclick={() => openDialog('password')}>Passwort ändern</button>
      <button class="btn" onclick={() => openDialog('code')}>Neuen Wiederherstellungscode erzeugen</button>
    </div>
  </section>

  <section class="card">
    <div class="card-head">
      <h2>Sicherungen</h2>
      <div class="buttons">
        <button class="btn" onclick={() => api.openFolder('backups')}>Ordner öffnen</button>
        <button class="btn primary" onclick={backupNow}>Jetzt sichern</button>
      </div>
    </div>
    <p class="muted">Automatisch beim Schließen und einmal täglich. Aufbewahrt werden die letzten 14 Tages- und 12 Monatsstände.</p>

    <div class="extra">
      <div>
        <h3>Zusätzlicher Sicherungsordner</h3>
        <p class="muted small">{app.config.extraBackupDir ?? 'Keiner, z. B. einen USB-Stick oder eine externe Festplatte wählen.'}</p>
      </div>
      <div class="buttons">
        {#if app.config.extraBackupDir}
          <button class="btn ghost" onclick={() => setConfig({ extraBackupDir: null })}>Entfernen</button>
        {/if}
        <button class="btn" onclick={chooseExtra}>{app.config.extraBackupDir ? 'Ändern' : 'Ordner wählen'}</button>
      </div>
    </div>

    <h3 class="list-title">Letzte Sicherungen</h3>
    {#if backups.length === 0}
      <p class="muted small">Noch keine Sicherungen vorhanden.</p>
    {:else}
      <ul class="backups">
        {#each shown as b (b.path)}
          <li>
            <span>{fmt.format(new Date(b.modified))}</span>
            <span class="muted small">{KIND[b.kind] ?? b.kind}</span>
            <button class="btn ghost" onclick={() => ((restoreTarget = b), (dialog = 'restore'))}>Wiederherstellen</button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="card">
    <div class="card-head"><h2>Allgemein</h2></div>
    <label class="field inline">
      Startseite beim Öffnen
      <select bind:value={app.data.settings.startPage}>
        {#each PAGES as p}
          <option value={p.id}>{p.label}</option>
        {/each}
      </select>
    </label>

    <label class="field inline">
      Stunden auf der Startseite
      <select value={app.data.settings.lessonsFolded ? 'zu' : 'auf'} onchange={(e) => (app.data.settings.lessonsFolded = e.currentTarget.value === 'zu')}>
        <option value="auf">ausgeklappt (Kurzbeschreibung, To-dos, letzte Stunde)</option>
        <option value="zu">eingeklappt (nur Kurzbeschreibung)</option>
      </select>
    </label>

    <div class="extra">
      <div>
        <h3>Updates</h3>
        <p class="muted small">
          {#if update.phase === 'checking'}Suche läuft …
          {:else if update.phase === 'none'}Lehrerpult {app.version} ist aktuell.
          {:else if update.phase === 'available'}Version {update.latest} ist verfügbar (installiert: {app.version}).
          {:else if update.phase === 'loading'}Version {update.latest} wird geladen … {update.percent} %
          {:else if update.phase === 'ready'}Version {update.latest} ist bereit. Beim Installieren startet das Lehrerpult neu; vorher wird gesichert.
          {:else if update.phase === 'error'}<span class="error">{update.error}</span>
          {:else}Installiert ist Version {app.version}. Gesucht wird nur, wenn du es anstößt.{/if}
        </p>
      </div>
      {#if update.phase === 'available'}
        <button class="btn primary" onclick={downloadUpdate}>Herunterladen</button>
      {:else if update.phase === 'ready'}
        <button class="btn primary" onclick={installUpdate}>Jetzt installieren</button>
      {:else}
        <button class="btn" disabled={update.phase === 'checking' || update.phase === 'loading'} onclick={checkUpdate}>Nach Updates suchen</button>
      {/if}
    </div>

    <div class="extra">
      <div>
        <h3>Neues Schuljahr</h3>
        <p class="muted small">Alten Stand archivieren, Klassen umbenennen oder löschen und Noten, Listen und Stundenverlauf leeren.</p>
      </div>
      <button class="btn" onclick={() => (dialog = 'year')}>Schuljahr wechseln</button>
    </div>

    <div class="extra">
      <div>
        <h3>Gerätewechsel</h3>
        <p class="muted small">Datei „lehrerpult.dat“ aus dem Datenordner auf das neue Gerät kopieren und dort beim ersten Start „Daten von einem anderen Gerät übernehmen“ wählen.</p>
      </div>
      <button class="btn" onclick={() => api.openFolder('data')}>Datenordner öffnen</button>
    </div>
  </section>

  <p class="muted small">Lehrerpult {app.version}</p>
</div>

{#if dialog === 'year'}
  <YearDialog onclose={() => (dialog = null)} ondone={() => ((dialog = null), refresh(), flash('Neues Schuljahr eingerichtet. Der alte Stand liegt als Archiv bei den Sicherungen.'))} />
{:else if dialog === 'password'}
  <Modal title="Passwort ändern" onclose={() => (dialog = null)}>
    <label class="field">Bisheriges Passwort<input type="password" bind:value={form.old} /></label>
    <label class="field">Neues Passwort<input type="password" bind:value={form.pw} /></label>
    <label class="field">Neues Passwort wiederholen<input type="password" bind:value={form.pw2} /></label>
    {#if form.error}<p class="error">{form.error}</p>{/if}
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (dialog = null)}>Abbrechen</button>
      <button class="btn primary" onclick={changePassword}>Ändern</button>
    {/snippet}
  </Modal>
{:else if dialog === 'code'}
  <Modal title="Neuer Wiederherstellungscode" onclose={() => (dialog = null)}>
    {#if form.code}
      <p class="muted">Der alte Code gilt ab sofort nicht mehr. Notiere den neuen Code.</p>
      <RecoveryCode code={form.code} />
    {:else}
      <p class="muted">Danach gilt der bisherige Code nicht mehr.</p>
      <label class="field">Passwort zur Bestätigung<input type="password" bind:value={form.old} /></label>
      {#if form.error}<p class="error">{form.error}</p>{/if}
    {/if}
    {#snippet actions()}
      {#if form.code}
        <button class="btn primary" onclick={() => (dialog = null)}>Fertig</button>
      {:else}
        <button class="btn ghost" onclick={() => (dialog = null)}>Abbrechen</button>
        <button class="btn primary" onclick={newCode}>Code erzeugen</button>
      {/if}
    {/snippet}
  </Modal>
{:else if dialog === 'restore'}
  <Modal title="Sicherung wiederherstellen?" onclose={() => (dialog = null)}>
    <p>Stand vom {fmt.format(new Date(restoreTarget.modified))}.</p>
    <p class="muted">Alle Änderungen danach gehen verloren. Der aktuelle Stand wird vorher zusätzlich gesichert.</p>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (dialog = null)}>Abbrechen</button>
      <button class="btn danger" onclick={restore}>Wiederherstellen</button>
    {/snippet}
  </Modal>
{/if}

<style>
  h1 {
    margin-bottom: 1.6rem;
  }
  .stack {
    display: grid;
    gap: 1.25rem;
    max-width: 780px;
  }
  .card > * + * {
    margin-top: 1rem;
  }
  .card > .card-head + * {
    margin-top: 0;
  }
  fieldset {
    border: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.4rem;
  }
  legend {
    font-weight: 500;
    font-size: 0.92rem;
    margin-bottom: 0.4rem;
  }
  .radio {
    display: flex;
    gap: 0.55rem;
    align-items: center;
  }
  .field.inline select {
    max-width: 340px;
  }
  .buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .extra {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.9rem 1rem;
    background: var(--bg-soft);
    border-radius: var(--radius-sm);
  }
  .list-title {
    margin-top: 1.3rem !important;
  }
  .backups {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
  }
  .backups li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 1rem;
    padding: 0.35rem 0.4rem 0.35rem 0.9rem;
  }
  .backups li + li {
    border-top: 1px solid var(--line);
  }
  .notice {
    margin-bottom: 1rem;
    padding: 0.6rem 0.9rem;
    border-radius: var(--radius-sm);
    background: var(--accent-soft);
    color: var(--accent);
    max-width: 780px;
  }
</style>
