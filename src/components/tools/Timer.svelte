<script>
  import Play from '@lucide/svelte/icons/play';
  import Pause from '@lucide/svelte/icons/pause';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import X from '@lucide/svelte/icons/x';
  import { onDestroy } from 'svelte';
  import { app } from '../../lib/store.svelte.js';
  import Stage from './Stage.svelte';
  import { chime } from '../../lib/session.svelte.js';

  const PRESETS = [1, 2, 3, 5, 10, 15, 20];

  let mode = $state('timer'); // timer | phasen | stoppuhr
  let sound = $state(true);
  let running = $state(false);
  let finished = $state(false);
  let tick = null;

  // Timer und Phasen zählen herunter
  let total = $state(5 * 60);
  let remaining = $state(5 * 60);
  let endAt = 0;
  let phaseIndex = $state(0);

  // Phasen werden gespeichert, z. B. Einzelarbeit → Partnerarbeit → Plenum.
  if (!app.data.settings.timerPhases)
    app.data.settings.timerPhases = [
      { name: 'Einzelarbeit', minutes: 5 },
      { name: 'Partnerarbeit', minutes: 10 },
    ];
  const phases = $derived(app.data.settings.timerPhases);
  const phase = $derived(mode === 'phasen' ? phases[phaseIndex] : null);
  const nextPhase = $derived(mode === 'phasen' ? phases[phaseIndex + 1] : null);

  // Stoppuhr zählt hoch
  let elapsed = $state(0);
  let startedAt = 0;

  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const progress = $derived(total ? remaining / total : 0);

  function stop() {
    clearInterval(tick);
    running = false;
  }

  function set(seconds) {
    stop();
    total = remaining = Math.max(0, seconds);
    finished = false;
  }

  function loadPhase(i) {
    phaseIndex = i;
    set((phases[i]?.minutes ?? 0) * 60);
  }

  function switchMode(m) {
    stop();
    mode = m;
    finished = false;
    if (m === 'phasen') loadPhase(0);
    if (m === 'timer') set(5 * 60);
    if (m === 'stoppuhr') elapsed = 0;
  }

  function start() {
    finished = false;
    if (mode === 'stoppuhr') {
      startedAt = Date.now() - elapsed * 1000;
      running = true;
      tick = setInterval(() => (elapsed = (Date.now() - startedAt) / 1000), 100);
      return;
    }
    if (remaining <= 0) return;
    endAt = Date.now() + remaining * 1000;
    running = true;
    tick = setInterval(update, 200);
  }

  function update() {
    remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    if (remaining > 0) return;
    stop();
    if (mode === 'phasen' && phaseIndex < phases.length - 1) {
      if (sound) chime(2);
      loadPhase(phaseIndex + 1);
      start();
    } else {
      finished = true;
      if (sound) chime();
    }
  }

  function reset() {
    if (mode === 'stoppuhr') {
      stop();
      elapsed = 0;
    } else if (mode === 'phasen') loadPhase(0);
    else set(total);
  }

  onDestroy(stop);
</script>

<div class="seg">
  <button class:on={mode === 'timer'} onclick={() => switchMode('timer')}>Timer</button>
  <button class:on={mode === 'phasen'} onclick={() => switchMode('phasen')}>Phasen</button>
  <button class:on={mode === 'stoppuhr'} onclick={() => switchMode('stoppuhr')}>Stoppuhr</button>
</div>

{#if mode === 'phasen'}
  <div class="phases">
    {#each phases as p, i}
      <div class="phase" class:current={i === phaseIndex}>
        <span class="nr">{i + 1}.</span>
        <input type="text" aria-label="Name der Phase" bind:value={p.name} />
        <input type="number" min="1" max="180" aria-label="Minuten" bind:value={p.minutes} onchange={() => !running && i === phaseIndex && loadPhase(i)} />
        <span class="muted">Min</span>
        <button class="btn ghost icon" aria-label="Phase entfernen" disabled={running || phases.length <= 1} onclick={() => (phases.splice(i, 1), loadPhase(0))}><X size={15} /></button>
      </div>
    {/each}
    <button class="link small" disabled={running} onclick={() => phases.push({ name: '', minutes: 5 })}>Phase hinzufügen</button>
  </div>
{/if}

<Stage>
  {#if mode === 'timer'}
    <div class="presets">
      {#each PRESETS as m}
        <button class="btn" onclick={() => set(m * 60)}>{m} Min</button>
      {/each}
    </div>
  {:else if mode === 'phasen'}
    <div class="phasename">{finished ? '' : phase?.name || `Phase ${phaseIndex + 1}`}</div>
  {/if}

  <div class="adjust">
    {#if mode === 'timer'}<button class="btn ghost" disabled={running} onclick={() => set(remaining - 60)}>− 1 Min</button>{/if}
    <div class="time" class:finished>
      {#if mode === 'stoppuhr'}{mmss(elapsed)}<span class="tenth">,{Math.floor((elapsed * 10) % 10)}</span>
      {:else}{finished ? 'Zeit ist um' : mmss(remaining)}{/if}
    </div>
    {#if mode === 'timer'}<button class="btn ghost" disabled={running} onclick={() => set(remaining + 60)}>+ 1 Min</button>{/if}
  </div>

  {#if mode !== 'stoppuhr'}
    <div class="bar"><div style:width="{progress * 100}%"></div></div>
  {/if}
  {#if mode === 'phasen' && !finished}
    <p class="muted next">{nextPhase ? `Danach: ${nextPhase.name || 'Phase ' + (phaseIndex + 2)} (${nextPhase.minutes} Min)` : 'Letzte Phase'}</p>
  {/if}

  <div class="controls">
    {#if running}
      <button class="btn primary big" onclick={stop}><Pause size={20} /> Pause</button>
    {:else}
      <button class="btn primary big" disabled={mode !== 'stoppuhr' && remaining === 0} onclick={start}><Play size={20} /> Start</button>
    {/if}
    <button class="btn big" onclick={reset}><RotateCcw size={18} /> Zurücksetzen</button>
  </div>
  {#if mode !== 'stoppuhr'}
    <label class="sound"><input type="checkbox" bind:checked={sound} /> Signalton {mode === 'phasen' ? 'beim Wechsel und am Ende' : 'am Ende'}</label>
  {/if}
</Stage>

<style>
  .seg {
    display: inline-flex;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    overflow: hidden;
    margin-bottom: 0.9rem;
  }
  .seg button {
    border: none;
    background: #fff;
    padding: 0.45rem 0.9rem;
    font-weight: 500;
  }
  .seg button + button {
    border-left: 1px solid var(--line-strong);
  }
  .seg button.on {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .phases {
    display: grid;
    gap: 0.35rem;
    margin-bottom: 0.9rem;
    max-width: 520px;
    justify-items: start;
  }
  .phase {
    display: grid;
    grid-template-columns: 1.6rem 1fr 5rem auto auto;
    gap: 0.5rem;
    align-items: center;
    width: 100%;
    padding: 0.15rem 0.3rem;
    border-radius: var(--radius-sm);
  }
  .phase.current {
    background: var(--accent-soft);
  }
  .phase input {
    padding: 0.35rem 0.5rem;
    font: inherit;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    width: 100%;
  }
  .nr {
    color: var(--muted);
    text-align: right;
  }
  .presets,
  .controls,
  .adjust {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
  }
  .phasename {
    font-size: clamp(1.4rem, 3vw, 3rem);
    font-weight: 600;
    color: var(--accent);
    min-height: 1.3em;
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
  .tenth {
    font-size: 0.45em;
    color: var(--muted);
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
  .next {
    font-size: 1.05em;
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
