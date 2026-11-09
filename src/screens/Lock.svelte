<script>
  import AuthLayout from './AuthLayout.svelte';
  import { api } from '../lib/api.js';
  import { load } from '../lib/store.svelte.js';

  let mode = $state('unlock'); // unlock | recover
  let pw = $state('');
  let code = $state('');
  let newPw = $state('');
  let newPw2 = $state('');
  let error = $state('');
  let busy = $state(false);

  async function unlock(e) {
    e.preventDefault();
    error = '';
    busy = true;
    const res = await api.unlock(pw);
    busy = false;
    if (res.ok) load(res.data);
    else (error = res.error), (pw = '');
  }

  async function recover(e) {
    e.preventDefault();
    error = '';
    if (newPw.length < 8) return (error = 'Bitte mindestens 8 Zeichen verwenden.');
    if (newPw !== newPw2) return (error = 'Die beiden Passwörter stimmen nicht überein.');
    busy = true;
    const res = await api.recover(code, newPw);
    busy = false;
    if (res.ok) load(res.data);
    else error = res.error;
  }

  const autofocus = (node) => node.focus();
</script>

<AuthLayout>
  {#if mode === 'unlock'}
    <h1>Gesperrt</h1>
    <form onsubmit={unlock}>
      <label class="field">Passwort<input type="password" bind:value={pw} use:autofocus autocomplete="current-password" /></label>
      {#if error}<p class="error">{error}</p>{/if}
      <button class="btn primary" disabled={busy || !pw}>Entsperren</button>
    </form>
    <button class="link small" onclick={() => ((mode = 'recover'), (error = ''))}>Passwort vergessen?</button>
  {:else}
    <h1>Passwort zurücksetzen</h1>
    <p class="muted">Gib deinen Wiederherstellungscode ein und lege ein neues Passwort fest.</p>
    <form onsubmit={recover}>
      <label class="field">Wiederherstellungscode<input type="text" bind:value={code} use:autofocus placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" /></label>
      <label class="field">Neues Passwort<input type="password" bind:value={newPw} autocomplete="new-password" /></label>
      <label class="field">Neues Passwort wiederholen<input type="password" bind:value={newPw2} autocomplete="new-password" /></label>
      {#if error}<p class="error">{error}</p>{/if}
      <div class="row">
        <button type="button" class="btn ghost" onclick={() => ((mode = 'unlock'), (error = ''))}>Zurück</button>
        <button class="btn primary" disabled={busy}>Zurücksetzen und entsperren</button>
      </div>
    </form>
  {/if}
</AuthLayout>

<style>
  form {
    display: grid;
    gap: 0.9rem;
  }
  form > .btn.primary {
    justify-content: center;
  }
  .row {
    display: flex;
    justify-content: space-between;
  }
  .link {
    justify-self: start;
  }
</style>
