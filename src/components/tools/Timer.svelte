<script>
  import Play from '@lucide/svelte/icons/play';
  import Pause from '@lucide/svelte/icons/pause';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import { onDestroy } from 'svelte';
  import Stage from './Stage.svelte';
  import { chime } from '../../lib/session.svelte.js';

  const PRESETS = [1, 2, 3, 5, 10, 15, 20];

  let total = $state(5 * 60);
  let remaining = $state(5 * 60);
  let endAt = null;
  let running = $state(false);
  let finished = $state(false);
  let sound = $state(true);
  let tick = null;

  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const progress = $derived(total ? remaining / total : 0);

  function set(seconds) {
    stop();
    total = remaining = Math.max(0, seconds);
    finished = false;
  }

  function start() {
    if (remaining <= 0) return;
    finished = false;
    endAt = Date.now() + remaining * 1000;
    running = true;
    tick = setInterval(update, 200);
  }

  function update() {
    remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    if (remaining === 0) {
      stop();
      finished = true;
      if (sound) chime();
    }
  }

  function stop() {
    clearInterval(tick);
    running = false;
  }

  onDestroy(stop);
</script>

<Stage>
  <div class="presets">
    {#each PRESETS as m}
      <button class="btn" onclick={() => set(m * 60)}>{m} Min</button>
    {/each}
  </div>

  <div class="adjust">
    <button class="btn ghost" disabled={running} onclick={() => set(remaining - 60)}>− 1 Min</button>
    <div class="time" class:finished>{finished ? 'Zeit ist um' : mmss(remaining)}</div>
    <button class="btn ghost" disabled={running} onclick={() => set(remaining + 60)}>+ 1 Min</button>
  </div>

  <div class="bar"><div style:width="{progress * 100}%"></div></div>

  <div class="controls">
    {#if running}
      <button class="btn primary big" onclick={stop}><Pause size={20} /> Pause</button>
    {:else}
      <button class="btn primary big" disabled={remaining === 0} onclick={start}><Play size={20} /> Start</button>
    {/if}
    <button class="btn big" onclick={() => set(total)}><RotateCcw size={18} /> Zurücksetzen</button>
  </div>
  <label class="sound"><input type="checkbox" bind:checked={sound} /> Signalton am Ende</label>
</Stage>

<style>
  .presets,
  .controls,
  .adjust {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
  }
  .time {
    font-size: clamp(5rem, 13vw, 16rem);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.03em;
    line-height: 1;
    min-width: 4ch;
    text-align: center;
  }
  .time.finished {
    font-size: clamp(3rem, 7vw, 8rem);
    color: var(--accent);
  }
  .bar {
    width: min(720px, 90%);
    height: 8px;
    border-radius: 99px;
    background: var(--bg-side);
    overflow: hidden;
  }
  .bar div {
    height: 100%;
    background: var(--accent);
    transition: width 0.2s linear;
  }
  .big {
    padding: 0.7rem 1.4rem;
    font-size: 1.05rem;
  }
  .sound {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    color: var(--muted);
    font-size: 0.9rem;
  }
</style>
