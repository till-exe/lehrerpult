<script>
  import Plus from '@lucide/svelte/icons/plus';
  import Pencil from '@lucide/svelte/icons/pencil';
  import { app } from '../../lib/store.svelte.js';
  import { currentClass, studentsOf, uid } from '../../lib/classes.js';
  import { isPresent } from '../../lib/session.svelte.js';
  import Stage from './Stage.svelte';
  import Absent from './Absent.svelte';
  import Modal from '../Modal.svelte';

  const TONES = ['#2e6e61', '#4b8a7c', '#3d5f78', '#5d7f96'];

  const klass = $derived(currentClass());
  const classId = $derived(klass?.id ?? null);
  const students = $derived(klass ? studentsOf(klass.id) : []);

  // Mehrere Räder pro Klasse, z. B. „Abfrage“ und „Tafeldienst“. Gestrichene bleiben gespeichert.
  const wheels = $derived(app.data.wheels.filter((w) => w.classId === classId));
  let selectedId = $state(null);
  const wheel = $derived(wheels.find((w) => w.id === selectedId) ?? wheels[0] ?? null);

  function newWheel(name, source) {
    const w = { id: uid(), classId, name, source, entries: '', struck: {}, autoStrike: source === 'klasse' };
    app.data.wheels.push(w);
    selectedId = w.id;
  }

  $effect(() => {
    if (wheels.length === 0) newWheel(klass ? 'Alle' : 'Eigene Einträge', klass ? 'klasse' : 'eigene');
  });

  const items = $derived.by(() => {
    if (!wheel) return [];
    if (wheel.source === 'eigene')
      return [...new Set(wheel.entries.split('\n').map((x) => x.trim()).filter(Boolean))].map((label) => ({ key: label, label }));
    const firstCount = {};
    for (const s of students) firstCount[s.firstName] = (firstCount[s.firstName] ?? 0) + 1;
    return students.map((s) => ({
      key: s.id,
      label: firstCount[s.firstName] > 1 ? `${s.firstName} ${s.lastName.slice(0, 1)}.` : s.firstName || s.lastName,
      full: `${s.firstName} ${s.lastName}`,
      absent: !isPresent(s),
    }));
  });
  const pool = $derived(items.filter((i) => !i.absent && !wheel?.struck[i.key]));
  const struckCount = $derived(items.filter((i) => wheel?.struck[i.key]).length);

  let result = $state('');
  let spinning = $state(false);
  let rot = 0;
  let canvas = $state();

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
    canvas;
    draw();
  });

  function spin() {
    if (spinning || pool.length === 0) return;
    const n = pool.length;
    const seg = (Math.PI * 2) / n;
    const idx = Math.floor(Math.random() * n);
    const winner = pool[idx];
    const w = wheel;
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
        result = winner.full ?? winner.label;
        if (w.autoStrike) setTimeout(() => (w.struck[winner.key] = true), 1200);
      }
    };
    requestAnimationFrame(frame);
  }

  const toggleStrike = (key) => (wheel.struck[key] = !wheel.struck[key]);

  // Dialoge
  let dialog = $state(null); // new | rename | delete
  let form = $state({ name: '', source: 'klasse' });

  function openNew() {
    form = { name: '', source: klass ? 'klasse' : 'eigene' };
    dialog = 'new';
  }
  function submit() {
    if (!form.name.trim()) return;
    if (dialog === 'new') newWheel(form.name.trim(), form.source);
    else wheel.name = form.name.trim();
    dialog = null;
  }
  function removeWheel() {
    app.data.wheels = app.data.wheels.filter((w) => w.id !== wheel.id);
    selectedId = null;
    dialog = null;
  }
  const autofocus = (node) => node.focus();
</script>

{#if wheel}
  <div class="wheels">
    {#each wheels as w (w.id)}
      <button class:on={w.id === wheel.id} onclick={() => ((selectedId = w.id), (result = ''))}>{w.name}</button>
    {/each}
    <button class="add" onclick={openNew} title="Neues Glücksrad"><Plus size={16} /> Neues Rad</button>
  </div>

  <div class="layout">
    <Stage>
      <div class="wheel">
        <div class="pointer"></div>
        <canvas bind:this={canvas}></canvas>
        <button class="spin" onclick={spin} disabled={spinning || pool.length === 0}>Drehen</button>
      </div>
      <div class="result">{result || (pool.length === 0 ? 'Niemand mehr im Rad' : ' ')}</div>
    </Stage>

    <aside>
      <div class="head">
        <h3>{wheel.name}</h3>
        <button class="btn ghost icon" title="Umbenennen" onclick={() => ((form = { ...form, name: wheel.name }), (dialog = 'rename'))}><Pencil size={15} /></button>
        <button class="link small del" onclick={() => (dialog = 'delete')}>Löschen</button>
      </div>

      <label class="check"><input type="checkbox" bind:checked={wheel.autoStrike} /> Gezogene automatisch streichen</label>

      {#if wheel.source === 'eigene'}
        <label class="field">Einträge, einer pro Zeile<textarea rows="5" bind:value={wheel.entries}></textarea></label>
      {:else}
        <Absent {students} />
      {/if}

      <div class="listhead">
        <span class="muted small">Im Rad: {pool.length} von {items.length}. Antippen zum Streichen.</span>
        {#if struckCount}<button class="link small" onclick={() => (wheel.struck = {})}>Alle wieder aufnehmen</button>{/if}
      </div>
      <div class="names">
        {#each items as i (i.key)}
          <button class:struck={wheel.struck[i.key]} class:absent={i.absent} title={i.absent ? 'heute abwesend' : ''} onclick={() => toggleStrike(i.key)}>
            {i.full ?? i.label}
          </button>
        {:else}
          <p class="muted small">{wheel.source === 'eigene' ? 'Noch keine Einträge.' : 'In dieser Klasse sind noch keine Schüler.'}</p>
        {/each}
      </div>
    </aside>
  </div>
{/if}

{#if dialog === 'new' || dialog === 'rename'}
  <Modal title={dialog === 'new' ? 'Neues Glücksrad' : 'Glücksrad umbenennen'} onclose={() => (dialog = null)}>
    <form id="wheel-form" onsubmit={(e) => (e.preventDefault(), submit())}>
      <label class="field">Name<input type="text" bind:value={form.name} use:autofocus /></label>
      {#if dialog === 'new'}
        <div class="radios">
          <label><input type="radio" bind:group={form.source} value="klasse" disabled={!klass} /> Schüler der Klasse {klass?.name ?? ''}</label>
          <label><input type="radio" bind:group={form.source} value="eigene" /> Eigene Einträge</label>
        </div>
      {/if}
    </form>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (dialog = null)}>Abbrechen</button>
      <button class="btn primary" type="submit" form="wheel-form">{dialog === 'new' ? 'Anlegen' : 'Speichern'}</button>
    {/snippet}
  </Modal>
{:else if dialog === 'delete'}
  <Modal title="Glücksrad „{wheel.name}“ löschen?" onclose={() => (dialog = null)}>
    <p class="muted">Die Schüler bleiben erhalten, nur dieses Rad und seine Streichungen werden gelöscht.</p>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (dialog = null)}>Abbrechen</button>
      <button class="btn danger" onclick={removeWheel}>Löschen</button>
    {/snippet}
  </Modal>
{/if}

<style>
  .wheels {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: 0.9rem;
  }
  .wheels button {
    border: 1px solid var(--line-strong);
    background: #fff;
    border-radius: 999px;
    padding: 0.3rem 0.9rem;
    font-weight: 500;
  }
  .wheels button.on {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent);
  }
  .wheels .add {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    border-style: dashed;
    color: var(--muted);
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 1.25rem;
    align-items: start;
  }
  aside {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 1rem;
    display: grid;
    gap: 0.8rem;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }
  .head h3 {
    font-size: 1.05rem;
  }
  .del {
    margin-left: auto;
    color: var(--muted);
  }
  .check {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .listhead {
    display: grid;
    gap: 0.2rem;
  }
  .listhead .link {
    justify-self: start;
  }
  .names {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    max-height: 340px;
    overflow: auto;
  }
  .names button {
    border: 1px solid color-mix(in srgb, var(--accent) 35%, white);
    background: var(--accent-soft);
    color: var(--text);
    border-radius: 999px;
    padding: 0.15rem 0.65rem;
    font-size: 0.86rem;
  }
  .names button.struck {
    background: #fff;
    border-color: var(--line);
    color: var(--muted);
    text-decoration: line-through;
  }
  .names button.absent {
    opacity: 0.45;
  }
  .radios {
    display: grid;
    gap: 0.4rem;
  }
  .radios label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  form {
    display: grid;
    gap: 0.9rem;
  }
  .wheel {
    position: relative;
    width: min(500px, 52vh);
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
    font-size: clamp(2rem, 4.5vw, 4.5rem);
    font-weight: 650;
    color: var(--accent);
    min-height: 1.2em;
    text-align: center;
  }
</style>
