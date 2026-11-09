<script>
  import { app } from '../../lib/store.svelte.js';
  import { currentClass, studentsOf } from '../../lib/classes.js';
  import { isPresent } from '../../lib/session.svelte.js';
  import Stage from './Stage.svelte';
  import Absent from './Absent.svelte';

  const TONES = ['#2e6e61', '#4b8a7c', '#3d5f78', '#5d7f96'];

  let source = $state(app.data.classes.length ? 'klasse' : 'eigene');
  let removeDrawn = $state(false);
  let drawn = $state({});
  let result = $state('');
  let spinning = $state(false);
  let rot = 0;
  let canvas;

  const klass = $derived(currentClass());
  const students = $derived(klass ? studentsOf(klass.id) : []);

  const items = $derived.by(() => {
    if (source === 'eigene')
      return (app.data.settings.wheelCustom ?? '').split('\n').map((x) => x.trim()).filter(Boolean).map((label) => ({ key: label, label }));
    const present = students.filter(isPresent);
    const firstCount = {};
    for (const s of present) firstCount[s.firstName] = (firstCount[s.firstName] ?? 0) + 1;
    return present.map((s) => ({ key: s.id, label: firstCount[s.firstName] > 1 ? `${s.firstName} ${s.lastName.slice(0, 1)}.` : s.firstName || s.lastName }));
  });
  const pool = $derived(items.filter((i) => !drawn[i.key]));

  function draw() {
    if (!canvas) return;
    const size = 1000;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.height = size;
    const c = size / 2;
    const r = c - 8;
    ctx.clearRect(0, 0, size, size);
    const n = pool.length;
    if (n === 0) {
      ctx.fillStyle = '#f5f6f3';
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const seg = (Math.PI * 2) / n;
    const font = Math.max(18, Math.min(46, 900 / Math.max(n, 6)));
    pool.forEach((item, i) => {
      const a0 = rot + i * seg;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, r, a0, a0 + seg);
      ctx.closePath();
      // Benachbarte Felder nie gleich färben, auch nicht das letzte neben dem ersten.
      ctx.fillStyle = n > 1 && i === n - 1 && i % TONES.length === 0 ? TONES[2] : TONES[i % TONES.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.save();
      ctx.translate(c, c);
      const mid = (((a0 + seg / 2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const flip = mid > Math.PI / 2 && mid < (Math.PI * 3) / 2; // Schrift auf der linken Seite nicht auf dem Kopf
      ctx.rotate(a0 + seg / 2 + (flip ? Math.PI : 0));
      ctx.fillStyle = '#fff';
      ctx.font = `600 ${font}px "Inter Variable", "Segoe UI", sans-serif`;
      ctx.textAlign = flip ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, flip ? -(r - 28) : r - 28, 0, r * 0.7);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(c, c, 46, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  $effect(() => {
    pool;
    draw();
  });

  function spin() {
    if (spinning || pool.length === 0) return;
    const n = pool.length;
    const seg = (Math.PI * 2) / n;
    const idx = Math.floor(Math.random() * n);
    const winner = pool[idx];
    const jitter = (Math.random() - 0.5) * 0.7;
    let target = -Math.PI / 2 - (idx + 0.5 + jitter) * seg;
    while (target < rot + Math.PI * 2 * 6) target += Math.PI * 2;
    const from = rot;
    const t0 = performance.now();
    const dur = 4800;
    spinning = true;
    result = '';
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      rot = from + (target - from) * (1 - Math.pow(1 - t, 4));
      draw();
      if (t < 1) requestAnimationFrame(frame);
      else {
        spinning = false;
        result = winner.label;
        if (removeDrawn) setTimeout(() => (drawn[winner.key] = true), 1200);
      }
    };
    requestAnimationFrame(frame);
  }
</script>

<div class="setup">
  <div class="seg">
    <button class:on={source === 'klasse'} disabled={!klass} onclick={() => (source = 'klasse')}>Klasse {klass?.name ?? ''}</button>
    <button class:on={source === 'eigene'} onclick={() => (source = 'eigene')}>Eigene Einträge</button>
  </div>
  <label class="check"><input type="checkbox" bind:checked={removeDrawn} /> Gezogene entfernen</label>
  {#if Object.keys(drawn).length}<button class="link small" onclick={() => (drawn = {})}>Alle zurück aufs Rad</button>{/if}
</div>
{#if source === 'eigene'}
  <textarea class="custom" rows="3" placeholder="Ein Eintrag pro Zeile" bind:value={app.data.settings.wheelCustom}></textarea>
{:else if klass}
  <Absent {students} />
{/if}

<Stage>
  <div class="wheel">
    <div class="pointer"></div>
    <canvas bind:this={canvas}></canvas>
    <button class="spin" onclick={spin} disabled={spinning || pool.length === 0}>Drehen</button>
  </div>
  <div class="result">{result || ' '}</div>
</Stage>

<style>
  .setup {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.8rem;
  }
  .seg {
    display: flex;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    overflow: hidden;
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
  .check {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .custom {
    margin-bottom: 0.8rem;
    max-width: 900px;
  }
  .wheel {
    position: relative;
    width: min(520px, 54vh);
    aspect-ratio: 1;
  }
  :global(.stage.full) .wheel {
    width: min(78vh, 78vw);
  }
  canvas {
    width: 100%;
    height: 100%;
  }
  .pointer {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 16px solid transparent;
    border-right: 16px solid transparent;
    border-top: 30px solid var(--text);
    z-index: 1;
  }
  .spin {
    position: absolute;
    inset: 50% auto auto 50%;
    transform: translate(-50%, -50%);
    width: 18%;
    aspect-ratio: 1;
    border-radius: 50%;
    border: none;
    background: var(--text);
    color: #fff;
    font-weight: 600;
    font-size: clamp(0.8rem, 1.6vw, 1.3rem);
  }
  .spin:disabled {
    opacity: 0.6;
  }
  .result {
    font-size: clamp(2rem, 5vw, 5rem);
    font-weight: 650;
    color: var(--accent);
    min-height: 1.2em;
  }
</style>
