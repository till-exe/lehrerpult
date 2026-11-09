<script>
  import Mic from '@lucide/svelte/icons/mic';
  import { onDestroy } from 'svelte';
  import { app } from '../../lib/store.svelte.js';
  import Stage from './Stage.svelte';

  let level = $state(0);
  let peak = $state(0);
  let active = $state(false);
  let error = $state('');
  let stream, ctx, raf;

  if (app.data.settings.noiseLimit == null) app.data.settings.noiseLimit = 60;
  const limit = $derived(app.data.settings.noiseLimit);
  const status = $derived(level >= limit ? 'zu laut' : level >= limit * 0.75 ? 'etwas laut' : 'ruhig');

  async function start() {
    error = '';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch {
      error = 'Kein Zugriff aufs Mikrofon. In den Windows-Einstellungen unter Datenschutz → Mikrofon den Zugriff für Desktop-Apps erlauben.';
      return;
    }
    ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Float32Array(analyser.fftSize);
    active = true;
    const loop = () => {
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += v * v;
      const db = 20 * Math.log10(Math.sqrt(sum / data.length) + 1e-8); // ca. −90 … 0
      const target = Math.max(0, Math.min(100, ((db + 70) / 60) * 100));
      level = level * 0.85 + target * 0.15;
      peak = Math.max(level, peak - 0.25);
      raf = requestAnimationFrame(loop);
    };
    loop();
  }

  function stop() {
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((t) => t.stop());
    ctx?.close();
    active = false;
    level = peak = 0;
  }

  onDestroy(stop);
</script>

<Stage>
  {#if !active}
    <button class="btn primary big" onclick={start}><Mic size={20} /> Mikrofon starten</button>
    {#if error}<p class="error">{error}</p>{/if}
  {:else}
    <div class="status" class:warn={status === 'etwas laut'} class:loud={status === 'zu laut'}>{status}</div>
    <div class="meter">
      <div class="fill" class:warn={status === 'etwas laut'} class:loud={status === 'zu laut'} style:width="{level}%"></div>
      <div class="peak" style:left="{peak}%"></div>
      <div class="limit" style:left="{limit}%" title="Grenze"></div>
    </div>
    <label class="slider">
      Grenze „zu laut“
      <input type="range" min="20" max="95" bind:value={app.data.settings.noiseLimit} />
    </label>
    <button class="btn" onclick={stop}>Mikrofon beenden</button>
  {/if}
</Stage>

<style>
  .big {
    padding: 0.8rem 1.6rem;
    font-size: 1.05rem;
  }
  .status {
    font-size: clamp(3rem, 8vw, 9rem);
    font-weight: 650;
    color: var(--accent);
    transition: color 0.3s;
  }
  .status.warn {
    color: var(--warn);
  }
  .status.loud {
    color: var(--danger);
  }
  .meter {
    position: relative;
    width: min(900px, 92%);
    height: 48px;
    border-radius: 12px;
    background: var(--bg-side);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--accent);
    transition: background 0.3s;
  }
  .fill.warn {
    background: #c9852f;
  }
  .fill.loud {
    background: var(--danger);
  }
  .peak,
  .limit {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
  }
  .peak {
    background: rgba(0, 0, 0, 0.25);
  }
  .limit {
    width: 3px;
    background: var(--text);
  }
  .slider {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--muted);
  }
  .slider input {
    width: 260px;
    accent-color: var(--accent);
  }
  .error {
    max-width: 520px;
    text-align: center;
  }
</style>
