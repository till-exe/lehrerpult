<script>
  import { currentClass, studentsOf } from '../../lib/classes.js';
  import { isPresent, shuffled } from '../../lib/session.svelte.js';
  import Stage from './Stage.svelte';
  import Absent from './Absent.svelte';

  const klass = $derived(currentClass());
  const students = $derived(klass ? studentsOf(klass.id) : []);
  const present = $derived(students.filter(isPresent));

  let mode = $state('person');
  let shown = $state('');
  let rolling = $state(false);
  let noRepeat = $state(true);
  let used = $state({});

  let groupMode = $state('size');
  let groupValue = $state(4);
  let groups = $state([]);

  const name = (s) => `${s.firstName} ${s.lastName}`;

  function draw() {
    let pool = present.filter((s) => !noRepeat || !used[s.id]);
    if (pool.length === 0) {
      used = {};
      pool = present;
    }
    if (pool.length === 0) return;
    const winner = pool[Math.floor(Math.random() * pool.length)];
    rolling = true;
    let i = 0;
    const id = setInterval(() => {
      shown = name(present[i++ % present.length]);
    }, 70);
    setTimeout(() => {
      clearInterval(id);
      shown = name(winner);
      rolling = false;
      used[winner.id] = true;
    }, 900);
  }

  function makeGroups() {
    const list = shuffled(present);
    const n = Math.max(1, groupMode === 'size' ? Math.round(list.length / Math.max(1, groupValue)) : Number(groupValue));
    const out = Array.from({ length: Math.min(n, list.length) || 1 }, () => []);
    list.forEach((s, i) => out[i % out.length].push(s));
    groups = out;
  }
</script>

{#if !klass}
  <div class="empty"><p>Lege zuerst unter „Klasse“ eine Klasse mit Schülern an.</p></div>
{:else}
  <div class="setup">
    <div class="seg">
      <button class:on={mode === 'person'} onclick={() => (mode = 'person')}>Person ziehen</button>
      <button class:on={mode === 'gruppen'} onclick={() => (mode = 'gruppen')}>Gruppen bilden</button>
    </div>
    <span class="muted">{klass.name}: {present.length} anwesend</span>
  </div>
  <Absent {students} />

  {#if mode === 'person'}
    <Stage>
      <div class="name" class:rolling>{shown || ' '}</div>
      <button class="btn primary big" onclick={draw} disabled={rolling || present.length === 0}>Ziehen</button>
      <label class="check muted"><input type="checkbox" bind:checked={noRepeat} /> Niemanden doppelt ziehen, bis alle dran waren</label>
    </Stage>
  {:else}
    <Stage>
      <div class="gsetup">
        <select bind:value={groupMode}>
          <option value="size">Gruppen mit je</option>
          <option value="count">Anzahl Gruppen:</option>
        </select>
        <input type="number" min="1" max="30" bind:value={groupValue} />
        <span class="muted">{groupMode === 'size' ? 'Personen (ungefähr)' : ''}</span>
        <button class="btn primary" onclick={makeGroups} disabled={present.length === 0}>Gruppen bilden</button>
      </div>
      {#if groups.length}
        <div class="groups">
          {#each groups as g, i}
            <div class="group">
              <h3>Gruppe {i + 1}</h3>
              <ul>
                {#each g as s}<li>{name(s)}</li>{/each}
              </ul>
            </div>
          {/each}
        </div>
      {/if}
    </Stage>
  {/if}
{/if}

<style>
  .setup {
    display: flex;
    align-items: center;
    gap: 1rem;
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
  .name {
    font-size: clamp(2.5rem, 7vw, 8rem);
    font-weight: 650;
    text-align: center;
    color: var(--accent);
    min-height: 1.2em;
  }
  .name.rolling {
    color: var(--muted);
  }
  .big {
    padding: 0.7rem 1.6rem;
    font-size: 1.05rem;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }
  .gsetup {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .gsetup select {
    width: auto;
  }
  .gsetup input {
    width: 5rem;
    font: inherit;
    padding: 0.5rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
  }
  .groups {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.8rem;
  }
  .group {
    border: 1px solid var(--line);
    border-top: 3px solid var(--accent);
    border-radius: var(--radius-sm);
    padding: 0.8rem 1rem;
  }
  .group ul {
    margin: 0.4rem 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.15rem;
  }
</style>
