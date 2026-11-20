<script>
  import Play from '@lucide/svelte/icons/play';
  import Pause from '@lucide/svelte/icons/pause';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import X from '@lucide/svelte/icons/x';
  import { app } from '../../lib/store.svelte.js';
  import Stage from './Stage.svelte';
  import { timer, mmss, set, start, stop, reset, loadPhase, switchMode } from '../../lib/timer.svelte.js';

  const PRESETS = [1, 2, 3, 5, 10, 15, 20];

  // Phasen werden gespeichert, z. B. Einzelarbeit → Partnerarbeit → Plenum.
  if (!app.data.settings.timerPhases)
    app.data.settings.timerPhases = [
      { name: 'Einzelarbeit', minutes: 5 },
      { name: 'Partnerarbeit', minutes: 10 },
    ];
  const phases = $derived(app.data.settings.timerPhases);
  const phase = $derived(timer.mode === 'phasen' ? timer.phases[timer.phaseIndex] : null);
  const nextPhase = $derived(timer.mode === 'phasen' ? timer.phases[timer.phaseIndex + 1] : null);
  const progress = $derived(timer.total ? timer.remaining / timer.total : 0);
  if (timer.mode === 'phasen' && !timer.running && !timer.phases.length) loadPhase(0);

  // Eigene Zeit, z. B. 45 Min für eine Schulaufgabe
  let ownMin = $state('');
  let ownSec = $state('');
  function setOwn(e) {
    e.preventDefault();
    const secs = (Number(ownMin) || 0) * 60 + (Number(ownSec) || 0);
    if (secs > 0) set(secs);
  }
</script>

<div class="seg">
  <button class:on={timer.mode === 'timer'} disabled={timer.running} onclick={() => switchMode('timer')}>Timer</button>
  <button class:on={timer.mode === 'phasen'} disabled={timer.running} onclick={() => switchMode('phasen')}>Phasen</button>
  <button class:on={timer.mode === 'stoppuhr'} disabled={timer.running} onclick={() => switchMode('stoppuhr')}>Stoppuhr</button>
</div>

{#if timer.mode === 'phasen'}
  <div class="phases">
    {#each phases as p, i}
      <div class="phase" class:current={i === timer.phaseIndex}>
        <span class="nr">{i + 1}.</span>
        <input type="text" aria-label="Name der Phase" bind:value={p.name} />
        <input type="number" min="1" max="180" aria-label="Minuten" bind:value={p.minutes} onchange={() => !timer.running && i === timer.phaseIndex && loadPhase(i)} />
        <span class="muted">Min</span>
        <button class="btn ghost icon" aria-label="Phase entfernen" disabled={timer.running || phases.length <= 1} onclick={() => (phases.splice(i, 1), loadPhase(0))}><X size={15} /></button>
      </div>
    {/each}
    <button class="link small" disabled={timer.running} onclick={() => phases.push({ name: '', minutes: 5 })}>Phase hinzufügen</button>
  </div>
{/if}

<Stage>
  {#if timer.mode === 'timer'}
    <div class="presets">
      {#each PRESETS as m}
        <button class="btn" disabled={timer.running} onclick={() => set(m * 60)}>{m} Min</button>
      {/each}
      <form class="own" onsubmit={setOwn}>
        <input type="number" min="0" max="600" aria-label="Minuten" bind:value={ownMin} disabled={timer.running} />
        <span class="muted">Min</span>
        <input type="number" min="0" max="59" aria-label="Sekunden" bind:value={ownSec} disabled={timer.running} />
        <span class="muted">Sek</span>
        <button class="btn" disabled={timer.running || (!Number(ownMin) && !Number(ownSec))}>Setzen</button>
      </form>
    </div>
  {:else if timer.mode === 'phasen'}
    <div class="phasename">{timer.finished ? '' : phase?.name || `Phase ${timer.phaseIndex + 1}`}</div>
  {/if}

  <div class="adjust">
    {#if timer.mode === 'timer'}<button class="btn ghost" disabled={timer.running} onclick={() => set(timer.remaining - 60)}>− 1 Min</button>{/if}
    <div class="time" class:finished={timer.finished}>
      {#if timer.mode === 'stoppuhr'}{mmss(timer.elapsed)}<span class="tenth">,{Math.floor((timer.elapsed * 10) % 10)}</span>
      {:else}{timer.finished ? 'Zeit ist um' : mmss(timer.remaining)}{/if}
    </div>
    {#if timer.mode === 'timer'}<button class="btn ghost" disabled={timer.running} onclick={() => set(timer.remaining + 60)}>+ 1 Min</button>{/if}
  </div>

  {#if timer.mode !== 'stoppuhr'}
    <div class="bar"><div style:width="{progress * 100}%"></div></div>
  {/if}
  {#if timer.mode === 'phasen' && !timer.finished}
    <p class="muted next">{nextPhase ? `Danach: ${nextPhase.name || 'Phase ' + (timer.phaseIndex + 2)} (${nextPhase.minutes} Min)` : 'Letzte Phase'}</p>
  {/if}

  <div class="controls">
    {#if timer.running}
      <button class="btn primary big" onclick={stop}><Pause size={20} /> Pause</button>
    {:else}
      <button class="btn primary big" disabled={timer.mode !== 'stoppuhr' && timer.remaining === 0} onclick={start}><Play size={20} /> Start</button>
    {/if}
    <button class="btn big" onclick={reset}><RotateCcw size={18} /> Zurücksetzen</button>
  </div>
  {#if timer.mode !== 'stoppuhr'}
    <label class="sound"><input type="checkbox" bind:checked={timer.sound} /> Signalton {timer.mode === 'phasen' ? 'beim Wechsel und am Ende' : 'am Ende'}</label>
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
  .own {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-left: 0.8rem;
    padding-left: 0.8rem;
    border-left: 1px solid var(--line);
  }
  .own input {
    width: 4.2rem;
    padding: 0.45rem 0.4rem;
    font: inherit;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
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
