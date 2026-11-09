<script>
  import Shuffle from '@lucide/svelte/icons/shuffle';
  import Eraser from '@lucide/svelte/icons/eraser';
  import Printer from '@lucide/svelte/icons/printer';
  import { app } from '../lib/store.svelte.js';
  import { studentsOf } from '../lib/classes.js';

  let { klass } = $props();

  const DEFAULT = { rows: 5, cols: 6, seats: {} };
  const plan = $derived(app.data.seating[klass.id] ?? DEFAULT);
  const students = $derived(studentsOf(klass.id));
  const byId = $derived(new Map(students.map((s) => [s.id, s])));
  const seated = $derived(new Set(Object.values(plan.seats).filter((id) => byId.has(id))));
  const free = $derived(students.filter((s) => !seated.has(s.id)));

  let selected = $state(null); // { id, from }

  function ensure() {
    if (!app.data.seating[klass.id]) app.data.seating[klass.id] = structuredClone(DEFAULT);
    return app.data.seating[klass.id];
  }

  const key = (r, c) => `${r}-${c}`;

  // Setzt einen Schüler auf einen Platz; ein dort sitzender Schüler tauscht mit ihm.
  function place(studentId, from, to) {
    const p = ensure();
    const occupant = p.seats[to];
    if (from) delete p.seats[from];
    p.seats[to] = studentId;
    if (occupant && occupant !== studentId && from) p.seats[from] = occupant;
    selected = null;
  }

  function unseat(from) {
    delete ensure().seats[from];
    selected = null;
  }

  function clickSeat(k) {
    const occupant = plan.seats[k];
    if (selected) {
      if (selected.from === k) selected = null;
      else place(selected.id, selected.from, k);
    } else if (occupant && byId.has(occupant)) selected = { id: occupant, from: k };
  }

  function drop(e, k) {
    e.preventDefault();
    const d = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (k) place(d.id, d.from, k);
    else if (d.from) unseat(d.from);
  }
  const drag = (e, id, from) => e.dataTransfer.setData('text/plain', JSON.stringify({ id, from }));

  function resize(field, delta) {
    const p = ensure();
    p[field] = Math.min(12, Math.max(1, p[field] + delta));
    for (const k of Object.keys(p.seats)) {
      const [r, c] = k.split('-').map(Number);
      if (r >= p.rows || c >= p.cols) delete p.seats[k];
    }
  }

  function shuffle() {
    const p = ensure();
    const ids = students.map((s) => s.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    p.seats = {};
    let i = 0;
    for (let r = 0; r < p.rows && i < ids.length; r++) for (let c = 0; c < p.cols && i < ids.length; c++) p.seats[key(r, c)] = ids[i++];
  }
</script>

<div class="toolbar no-print">
  <div class="size">
    <span>Reihen</span>
    <button class="btn icon" onclick={() => resize('rows', -1)}>−</button><strong>{plan.rows}</strong><button class="btn icon" onclick={() => resize('rows', 1)}>+</button>
    <span>Plätze je Reihe</span>
    <button class="btn icon" onclick={() => resize('cols', -1)}>−</button><strong>{plan.cols}</strong><button class="btn icon" onclick={() => resize('cols', 1)}>+</button>
  </div>
  <div class="actions">
    <button class="btn" onclick={shuffle}><Shuffle size={17} /> Zufällig verteilen</button>
    <button class="btn" onclick={() => (ensure().seats = {})}><Eraser size={17} /> Leeren</button>
    <button class="btn" onclick={() => window.print()}><Printer size={17} /> Drucken</button>
  </div>
</div>

<div class="layout">
  <div class="room">
    <h2 class="print-only">Sitzplan {klass.name}</h2>
    <div class="board">Tafel</div>
    <div class="seats" style:grid-template-columns="repeat({plan.cols}, minmax(0, 1fr))">
      {#each { length: plan.rows } as _, r}
        {#each { length: plan.cols } as _, c}
          {@const k = key(r, c)}
          {@const s = byId.get(plan.seats[k])}
          <button
            class="seat"
            class:taken={s}
            class:sel={selected?.from === k}
            class:target={selected && selected.from !== k}
            draggable={!!s}
            ondragstart={(e) => s && drag(e, s.id, k)}
            ondragover={(e) => e.preventDefault()}
            ondrop={(e) => drop(e, k)}
            onclick={() => clickSeat(k)}
          >
            {#if s}<span class="first">{s.firstName}</span><span class="last">{s.lastName}</span>{/if}
          </button>
        {/each}
      {/each}
    </div>
  </div>

  <aside class="no-print" ondragover={(e) => e.preventDefault()} ondrop={(e) => drop(e, null)}>
    <h3>Ohne Platz ({free.length})</h3>
    <p class="muted small">Ziehen oder anklicken und dann einen Platz wählen.</p>
    {#if selected?.from}
      <button class="btn small-btn" onclick={() => unseat(selected.from)}>Vom Platz nehmen</button>
    {/if}
    <ul>
      {#each free as s (s.id)}
        <li>
          <button class="chip" class:sel={selected?.id === s.id} draggable="true" ondragstart={(e) => drag(e, s.id, null)} onclick={() => (selected = selected?.id === s.id ? null : { id: s.id, from: null })}>
            {s.firstName} {s.lastName}
          </button>
        </li>
      {/each}
    </ul>
  </aside>
</div>

<style>
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.2rem;
  }
  .size,
  .actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .size span {
    color: var(--muted);
    margin-left: 0.6rem;
  }
  .size span:first-child {
    margin-left: 0;
  }
  .size strong {
    min-width: 1.4rem;
    text-align: center;
  }
  .size .btn.icon {
    width: 2rem;
    justify-content: center;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 240px;
    gap: 1.5rem;
    align-items: start;
  }
  .board {
    margin: 0 auto 1.2rem;
    width: 50%;
    text-align: center;
    padding: 0.4rem;
    border-radius: var(--radius-sm);
    background: var(--bg-side);
    color: var(--muted);
    font-size: 0.85rem;
    letter-spacing: 0.04em;
  }
  .seats {
    display: grid;
    gap: 0.6rem;
  }
  .seat {
    min-height: 58px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-sm);
    background: #fff;
    display: grid;
    align-content: center;
    justify-items: center;
    padding: 0.3rem;
    color: var(--text);
    line-height: 1.2;
  }
  .seat.taken {
    border: 1px solid var(--line);
    border-top: 3px solid var(--accent);
    background: var(--bg-soft);
    cursor: grab;
  }
  .seat.target:hover {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .seat.sel {
    outline: 2px solid var(--accent);
  }
  .first {
    font-weight: 600;
  }
  .last {
    font-size: 0.82rem;
    color: var(--muted);
  }
  aside {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 1rem;
    display: grid;
    gap: 0.6rem;
    min-height: 200px;
    align-content: start;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .chip {
    border: 1px solid var(--line-strong);
    background: #fff;
    border-radius: 999px;
    padding: 0.2rem 0.7rem;
    font-size: 0.88rem;
    cursor: grab;
  }
  .chip.sel {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  .small-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.88rem;
    justify-self: start;
  }
  .print-only {
    display: none;
  }
  @media print {
    .print-only {
      display: block;
      margin-bottom: 1rem;
    }
    .layout {
      display: block;
    }
    .seat {
      break-inside: avoid;
    }
  }
</style>
