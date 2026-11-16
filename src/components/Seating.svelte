<script>
  import Shuffle from '@lucide/svelte/icons/shuffle';
  import Eraser from '@lucide/svelte/icons/eraser';
  import Printer from '@lucide/svelte/icons/printer';
  import Monitor from '@lucide/svelte/icons/monitor';
  import Plus from '@lucide/svelte/icons/plus';
  import { app } from '../lib/store.svelte.js';
  import { studentsOf, uid } from '../lib/classes.js';
  import { quickMark, entriesOf } from '../lib/oral.js';
  import { FORGOT_KINDS, forgotToday, toggleForgot } from '../lib/forgot.js';
  import { today } from '../lib/dates.js';
  import Modal from './Modal.svelte';
  import OralDialog from './OralDialog.svelte';

  let { klass, onstudent } = $props();

  // Platz "0-0" ist vorne links aus Sicht der Schüler (erste Reihe an der Tafel).
  const plans = $derived(app.data.seatplans.filter((p) => p.classId === klass.id));
  let selectedId = $state(null);
  const plan = $derived(plans.find((p) => p.id === selectedId) ?? plans[0] ?? null);

  function newPlan(name) {
    const p = { id: uid(), classId: klass.id, name, rows: 5, cols: 6, seats: {}, blocked: {} };
    app.data.seatplans.push(p);
    selectedId = p.id;
  }
  $effect(() => {
    if (plans.length === 0) newPlan('Sitzplan');
  });

  const students = $derived(studentsOf(klass.id));
  const byId = $derived(new Map(students.map((s) => [s.id, s])));
  const seated = $derived(new Set(Object.values(plan?.seats ?? {}).filter((id) => byId.has(id))));
  const free = $derived(students.filter((s) => !seated.has(s.id)));

  // svelte-ignore state_referenced_locally
  let mode = $state(seated.size ? 'unterricht' : 'bearbeiten'); // unterricht | bearbeiten | tische
  let beamer = $state(false);
  let roomEl = $state();
  const view = $derived(beamer ? 'schueler' : (app.data.settings.seatView ?? 'lehrer'));

  // Lehrersicht: Tafel unten, also um 180° gedreht.
  const rowOrder = $derived(Array.from({ length: plan?.rows ?? 0 }, (_, i) => (view === 'lehrer' ? plan.rows - 1 - i : i)));
  const colOrder = $derived(Array.from({ length: plan?.cols ?? 0 }, (_, i) => (view === 'lehrer' ? plan.cols - 1 - i : i)));

  const key = (r, c) => `${r}-${c}`;
  let selected = $state(null); // beim Bearbeiten: { id, from }
  let active = $state(null); // im Unterricht: angeklickter Schüler
  let dialog = $state(null);
  let planName = $state('');

  // Setzt einen Schüler auf einen Platz; ein dort sitzender Schüler tauscht mit ihm.
  function place(studentId, from, to) {
    if (plan.blocked[to]) return;
    const occupant = plan.seats[to];
    if (from) delete plan.seats[from];
    plan.seats[to] = studentId;
    if (occupant && occupant !== studentId && from) plan.seats[from] = occupant;
    selected = null;
  }

  function unseat(from) {
    delete plan.seats[from];
    selected = null;
  }

  function clickSeat(k) {
    const s = byId.get(plan.seats[k]);
    if (mode === 'tische') {
      if (plan.blocked[k]) delete plan.blocked[k];
      else {
        plan.blocked[k] = true;
        delete plan.seats[k];
      }
    } else if (mode === 'unterricht') {
      if (s) active = s;
    } else if (selected) {
      if (selected.from === k) selected = null;
      else place(selected.id, selected.from, k);
    } else if (s) selected = { id: s.id, from: k };
  }

  function drop(e, k) {
    e.preventDefault();
    if (mode !== 'bearbeiten') return;
    const d = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (k) place(d.id, d.from, k);
    else if (d.from) unseat(d.from);
  }
  const drag = (e, id, from) => e.dataTransfer.setData('text/plain', JSON.stringify({ id, from }));

  function resize(field, delta) {
    plan[field] = Math.min(12, Math.max(1, plan[field] + delta));
    for (const obj of [plan.seats, plan.blocked])
      for (const k of Object.keys(obj)) {
        const [r, c] = k.split('-').map(Number);
        if (r >= plan.rows || c >= plan.cols) delete obj[k];
      }
  }

  function shuffle() {
    const ids = students.map((s) => s.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    plan.seats = {};
    let i = 0;
    for (let r = 0; r < plan.rows; r++) for (let c = 0; c < plan.cols; c++) if (!plan.blocked[key(r, c)] && i < ids.length) plan.seats[key(r, c)] = ids[i++];
  }

  // Heutige mündliche Kurzvermerke für die Anzeige auf dem Platz.
  function todayMarks(s) {
    const list = entriesOf(s.id).filter((o) => o.date === today());
    const plus = list.filter((o) => o.mark === '+').length;
    const minus = list.filter((o) => o.mark === '−').length;
    const grades = list.filter((o) => o.grade).map((o) => o.grade);
    return [plus && `+${plus > 1 ? plus : ''}`, minus && `−${minus > 1 ? minus : ''}`, ...grades, ...FORGOT_KINDS.filter((k) => forgotToday(s.id, k.id)).map((k) => k.id === 'HA' ? 'HA' : 'Mat')].filter(Boolean);
  }

  function toggleBeamer() {
    if (document.fullscreenElement) document.exitFullscreen();
    else roomEl.requestFullscreen();
  }

  function submitPlan() {
    if (!planName.trim()) return;
    if (dialog === 'new') newPlan(planName.trim());
    else plan.name = planName.trim();
    dialog = null;
  }
  function removePlan() {
    app.data.seatplans = app.data.seatplans.filter((p) => p.id !== plan.id);
    selectedId = null;
    dialog = null;
  }
  const autofocus = (node) => node.focus();
</script>

<svelte:document onfullscreenchange={() => (beamer = document.fullscreenElement === roomEl)} />

{#if plan}
  <div class="top no-print">
    <div class="pills">
      {#each plans as p (p.id)}
        <button class:on={p.id === plan.id} onclick={() => (selectedId = p.id)}>{p.name}</button>
      {/each}
      <button class="addpill" title="Weiterer Sitzplan, z. B. für einen Fachraum" onclick={() => ((planName = ''), (dialog = 'new'))}><Plus size={15} /> Plan</button>
      <button class="link small quiet" onclick={() => ((planName = plan.name), (dialog = 'rename'))}>Umbenennen</button>
      {#if plans.length > 1}<button class="link small quiet" onclick={() => (dialog = 'delete')}>Löschen</button>{/if}
    </div>
    <div class="right">
      <div class="seg">
        <button class:on={view === 'lehrer'} onclick={() => (app.data.settings.seatView = 'lehrer')} title="Tafel unten: so siehst du die Klasse von vorne">Lehrersicht</button>
        <button class:on={view === 'schueler'} onclick={() => (app.data.settings.seatView = 'schueler')} title="Tafel oben">Schülersicht</button>
      </div>
      <div class="seg">
        <button class:on={mode === 'unterricht'} onclick={() => ((mode = 'unterricht'), (selected = null))}>Unterricht</button>
        <button class:on={mode !== 'unterricht'} onclick={() => (mode = 'bearbeiten')}>Bearbeiten</button>
      </div>
    </div>
  </div>

  {#if mode !== 'unterricht'}
    <div class="toolbar no-print">
      <div class="size">
        <span>Reihen</span>
        <button class="btn icon" onclick={() => resize('rows', -1)}>−</button><strong>{plan.rows}</strong><button class="btn icon" onclick={() => resize('rows', 1)}>+</button>
        <span>Plätze je Reihe</span>
        <button class="btn icon" onclick={() => resize('cols', -1)}>−</button><strong>{plan.cols}</strong><button class="btn icon" onclick={() => resize('cols', 1)}>+</button>
        <button class="btn" class:toggled={mode === 'tische'} onclick={() => ((mode = mode === 'tische' ? 'bearbeiten' : 'tische'), (selected = null))} title="Plätze anklicken, um Tische zu entfernen oder wieder aufzustellen – so entstehen Gänge und Einzeltische">
          Tische und Gänge
        </button>
      </div>
      <div class="actions">
        <button class="btn" onclick={shuffle}><Shuffle size={17} /> Zufällig verteilen</button>
        <button class="btn" onclick={() => (plan.seats = {})}><Eraser size={17} /> Leeren</button>
      </div>
    </div>
    {#if mode === 'tische'}<p class="hint no-print">Klick auf einen Platz entfernt den Tisch oder stellt ihn wieder auf.</p>{/if}
  {:else}
    <div class="toolbar no-print">
      <p class="muted small">Schüler anklicken für +, −, Note oder Vergessenes.</p>
      <div class="actions">
        <button class="btn" onclick={toggleBeamer} title="Sitzplan aus Schülersicht im Vollbild"><Monitor size={17} /> Für den Beamer</button>
        <button class="btn" onclick={() => window.print()}><Printer size={17} /> Drucken</button>
      </div>
    </div>
  {/if}

  <div class="layout" class:wide={mode === 'unterricht'}>
    <div class="room" class:beamer bind:this={roomEl}>
      <h2 class="print-only">Sitzplan {klass.name}{plans.length > 1 ? ` – ${plan.name}` : ''}</h2>
      {#if beamer}<h2 class="beamer-title">Sitzplan {klass.name}</h2>{/if}
      {#if view === 'schueler'}<div class="board">Tafel</div>{/if}
      <div class="seats" style:grid-template-columns="repeat({plan.cols}, minmax(0, 1fr))">
        {#each rowOrder as r (r)}
          {#each colOrder as c (c)}
            {@const k = key(r, c)}
            {@const s = byId.get(plan.seats[k])}
            {#if plan.blocked[k] && mode !== 'tische'}
              <div class="gapcell"></div>
            {:else}
              <button
                class="seat"
                class:taken={s}
                class:blocked={plan.blocked[k]}
                class:sel={selected?.from === k}
                class:target={mode === 'bearbeiten' && selected && selected.from !== k}
                class:static={beamer || (mode === 'unterricht' && !s)}
                draggable={mode === 'bearbeiten' && !!s}
                ondragstart={(e) => s && drag(e, s.id, k)}
                ondragover={(e) => e.preventDefault()}
                ondrop={(e) => drop(e, k)}
                onclick={() => !beamer && clickSeat(k)}
              >
                {#if s}
                  <span class="first">{s.firstName}</span><span class="last">{s.lastName}</span>
                  {#if mode === 'unterricht' && !beamer}
                    {@const marks = todayMarks(s)}
                    {#if marks.length}<span class="marks">{marks.join(' ')}</span>{/if}
                  {/if}
                {/if}
              </button>
            {/if}
          {/each}
        {/each}
      </div>
      {#if view === 'lehrer'}<div class="board bottom">Tafel</div>{/if}
    </div>

    {#if mode !== 'unterricht'}
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
    {/if}
  </div>
{/if}

{#if active && dialog === 'oral'}
  <OralDialog student={active} onclose={() => ((dialog = null), (active = null))} />
{:else if active}
  <Modal title="{active.firstName} {active.lastName}" onclose={() => (active = null)}>
    <div class="quick">
      <button class="big" onclick={() => (quickMark(active, '+'), (active = null))}>+</button>
      <button class="big" onclick={() => (quickMark(active, '−'), (active = null))}>−</button>
      <button class="big text" onclick={() => (dialog = 'oral')}>Note …</button>
    </div>
    <div class="quick">
      {#each FORGOT_KINDS as k}
        <button class="fg" class:on={forgotToday(active.id, k.id)} onclick={() => (toggleForgot(active, k.id), (active = null))}>{k.label} vergessen</button>
      {/each}
    </div>
    {#snippet actions()}
      <button class="btn ghost left" onclick={() => (onstudent(active), (active = null))}>Übersicht öffnen</button>
      <button class="btn" onclick={() => (active = null)}>Schließen</button>
    {/snippet}
  </Modal>
{:else if dialog === 'new' || dialog === 'rename'}
  <Modal title={dialog === 'new' ? 'Neuer Sitzplan' : 'Sitzplan umbenennen'} onclose={() => (dialog = null)}>
    <form id="seat-form" onsubmit={(e) => (e.preventDefault(), submitPlan())}>
      <label class="field">Name<input type="text" bind:value={planName} use:autofocus /></label>
    </form>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (dialog = null)}>Abbrechen</button>
      <button class="btn primary" type="submit" form="seat-form">Speichern</button>
    {/snippet}
  </Modal>
{:else if dialog === 'delete'}
  <Modal title="Sitzplan „{plan.name}“ löschen?" onclose={() => (dialog = null)}>
    <p class="muted">Die Schüler bleiben erhalten, nur dieser Plan wird gelöscht.</p>
    {#snippet actions()}
      <button class="btn ghost" onclick={() => (dialog = null)}>Abbrechen</button>
      <button class="btn danger" onclick={removePlan}>Löschen</button>
    {/snippet}
  </Modal>
{/if}

<style>
  .top,
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.9rem;
  }
  .pills,
  .right,
  .size,
  .actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .right {
    gap: 0.8rem;
  }
  .pills > button:not(.link) {
    border: 1px solid var(--line-strong);
    background: #fff;
    border-radius: 999px;
    padding: 0.3rem 0.9rem;
    font-weight: 500;
  }
  .pills > button.on {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent);
  }
  .pills .addpill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    border-style: dashed;
    color: var(--muted);
  }
  .quiet {
    color: var(--muted);
    margin-left: 0.5rem;
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
    padding: 0.4rem 0.8rem;
    font-weight: 500;
  }
  .seg button + button {
    border-left: 1px solid var(--line-strong);
  }
  .seg button.on {
    background: var(--accent-soft);
    color: var(--accent);
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
  .size .btn:not(.icon) {
    margin-left: 0.8rem;
  }
  .btn.toggled {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent);
  }
  .hint {
    margin: -0.3rem 0 0.8rem;
    color: var(--accent);
    font-size: 0.9rem;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 240px;
    gap: 1.5rem;
    align-items: start;
  }
  .layout.wide {
    grid-template-columns: minmax(0, 1fr);
    max-width: 1100px;
  }
  .room.beamer {
    background: #fff;
    padding: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .room.beamer .seat {
    min-height: 11vh;
    font-size: 1.5rem;
  }
  .beamer-title {
    text-align: center;
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
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
  .board.bottom {
    margin: 1.2rem auto 0;
  }
  .seats {
    display: grid;
    gap: 0.6rem;
  }
  .gapcell {
    min-height: 62px;
  }
  .seat {
    min-height: 62px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-sm);
    background: #fff;
    display: grid;
    align-content: center;
    justify-items: center;
    padding: 0.3rem;
    color: var(--text);
    line-height: 1.2;
    position: relative;
  }
  .seat.taken {
    border: 1px solid var(--line);
    border-top: 3px solid var(--accent);
    background: var(--bg-soft);
  }
  .seat.taken:not(.static):hover {
    background: var(--accent-soft);
  }
  .seat.static {
    cursor: default;
  }
  .seat.blocked {
    border-style: dotted;
    background: repeating-linear-gradient(45deg, #fff, #fff 6px, var(--bg-side) 6px, var(--bg-side) 12px);
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
    font-size: 0.82em;
    color: var(--muted);
  }
  .marks {
    position: absolute;
    top: 2px;
    right: 5px;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--accent);
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
  .quick {
    display: flex;
    gap: 0.5rem;
  }
  .big {
    flex: 1;
    padding: 0.9rem;
    font-size: 1.6rem;
    font-weight: 700;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    background: #fff;
  }
  .big.text {
    font-size: 1rem;
    font-weight: 600;
  }
  .big:hover,
  .fg:hover {
    background: var(--accent-soft);
    border-color: var(--accent);
  }
  .fg {
    flex: 1;
    padding: 0.55rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    background: #fff;
  }
  .fg.on {
    background: var(--warn-soft);
    border-color: var(--warn);
    color: var(--warn);
  }
  .left {
    margin-right: auto;
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
    .marks {
      display: none;
    }
  }
</style>
