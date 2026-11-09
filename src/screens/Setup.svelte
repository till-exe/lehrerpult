<script>
  import AuthLayout from './AuthLayout.svelte';
  import RecoveryCode from '../components/RecoveryCode.svelte';
  import { api } from '../lib/api.js';
  import { app, emptyData, load } from '../lib/store.svelte.js';

  let step = $state('choose'); // choose | password | code
  let pw = $state('');
  let pw2 = $state('');
  let error = $state('');
  let busy = $state(false);
  let code = $state('');
  let noted = $state(false);

  async function create(e) {
    e.preventDefault();
    error = '';
    if (pw.length < 8) return (error = 'Bitte mindestens 8 Zeichen verwenden.');
    if (pw !== pw2) return (error = 'Die beiden Passwörter stimmen nicht überein.');
    busy = true;
    const res = await api.setup(pw, emptyData());
    busy = false;
    if (!res.ok) return (error = res.error);
    code = res.recoveryCode;
    step = 'code';
  }

  async function importFile() {
    error = '';
    const res = await api.importFile();
    if (res.ok) app.phase = 'locked';
    else if (res.error) error = res.error;
  }
</script>

<AuthLayout>
  {#if step === 'choose'}
    <h1>Willkommen</h1>
    <p class="muted">Deine Daten liegen verschlüsselt in einer Datei auf diesem Laptop und werden automatisch gesichert.</p>
    <div class="choices">
      <button class="btn primary" onclick={() => (step = 'password')}>Neu beginnen</button>
      <button class="btn" onclick={importFile}>Daten von einem anderen Gerät übernehmen</button>
    </div>
    {#if error}<p class="error">{error}</p>{/if}
  {:else if step === 'password'}
    <h1>Passwort festlegen</h1>
    <p class="muted">Es schützt deine Daten. Abgefragt wird es nur, wenn der Laptop gesperrt war; das kannst du später in den Einstellungen ändern.</p>
    <form onsubmit={create}>
      <label class="field">Passwort<input type="password" bind:value={pw} autocomplete="new-password" /></label>
      <label class="field">Passwort wiederholen<input type="password" bind:value={pw2} autocomplete="new-password" /></label>
      {#if error}<p class="error">{error}</p>{/if}
      <div class="row">
        <button type="button" class="btn ghost" onclick={() => (step = 'choose')}>Zurück</button>
        <button class="btn primary" disabled={busy}>Weiter</button>
      </div>
    </form>
  {:else}
    <h1>Wiederherstellungscode</h1>
    <p class="muted">Falls du dein Passwort vergisst, kommst du nur mit diesem Code wieder an deine Daten. Schreib ihn auf und bewahre ihn getrennt vom Laptop auf.</p>
    <RecoveryCode {code} />
    <label class="check"><input type="checkbox" bind:checked={noted} /> Ich habe den Code notiert.</label>
    <button class="btn primary" disabled={!noted} onclick={() => load(emptyData())}>Lehrerpult öffnen</button>
  {/if}
</AuthLayout>

<style>
  form,
  .choices {
    display: grid;
    gap: 0.9rem;
  }
  .choices .btn {
    justify-content: center;
    padding: 0.7rem;
  }
  .row {
    display: flex;
    justify-content: space-between;
  }
  .check {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
</style>
