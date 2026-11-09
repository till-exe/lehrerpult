<script>
  import QRCode from 'qrcode';
  import { app } from '../../lib/store.svelte.js';
  import Stage from './Stage.svelte';

  let svg = $state('');
  const text = $derived(app.data.settings.qrText ?? '');

  $effect(() => {
    const t = text.trim();
    if (!t) return void (svg = '');
    QRCode.toString(t, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1c2320', light: '#ffffff' } })
      .then((s) => (svg = s))
      .catch(() => (svg = ''));
  });
</script>

<label class="field input">
  Link oder Text
  <input type="text" placeholder="https://…" value={text} oninput={(e) => (app.data.settings.qrText = e.currentTarget.value)} />
</label>

<Stage>
  {#if svg}
    <div class="qr">{@html svg}</div>
    <p class="caption">{text}</p>
  {:else}
    <p class="muted">Gib oben einen Link oder Text ein.</p>
  {/if}
</Stage>

<style>
  .input {
    max-width: 720px;
    margin-bottom: 0.8rem;
  }
  .qr {
    width: min(440px, 60vh);
    aspect-ratio: 1;
  }
  :global(.stage.full) .qr {
    width: min(80vh, 80vw);
  }
  .qr :global(svg) {
    width: 100%;
    height: 100%;
  }
  .caption {
    color: var(--muted);
    max-width: 90%;
    word-break: break-all;
    text-align: center;
  }
</style>
