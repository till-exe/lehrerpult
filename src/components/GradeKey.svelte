<script>
  import { app } from '../lib/store.svelte.js';
  import { KEY_PRESETS, gradeKey, gradeFor } from '../lib/exams.js';

  // Der Schlüssel wird gespeichert, damit er beim nächsten Mal wieder da ist.
  if (!app.data.settings.gradeKey) app.data.settings.gradeKey = { total: 40, step: 0.5, percents: [...KEY_PRESETS[0].percents] };
  const k = $derived(app.data.settings.gradeKey);

  let points = $state('');
  const fmt = (n) => n.toLocaleString('de-DE', { maximumFractionDigits: 1 });
  const rows = $derived(k.total > 0 ? gradeKey(k.total, k.percents, k.step) : []);
  const valid = $derived(k.percents.every((p, i) => i === 0 || p < k.percents[i - 1]));
  const result = $derived(points !== '' && k.total > 0 ? gradeFor(Number(points), k.total, k.percents, k.step) : null);
</script>

<div class="wrap">
  <section class="card">
    <h2>Einstellungen</h2>
    <div class="row">
      <label class="field">Gesamtpunkte (BE)<input type="number" min="1" step="0.5" bind:value={k.total} /></label>
      <label class="field">Abstufung
        <select bind:value={k.step}>
          <option value={1}>Ganze Punkte</option>
          <option value={0.5}>Halbe Punkte</option>
        </select>
      </label>
    </div>

    <div class="field">
      Mindestprozent je Note
      <div class="percents">
        {#each k.percents as _, i}
          <label><span class="small muted">Note {i + 1} ab</span><span class="pct"><input type="number" min="0" max="100" step="0.5" bind:value={k.percents[i]} /><span class="muted">%</span></span></label>
        {/each}
      </div>
    </div>
    {#if !valid}<p class="error">Die Prozentwerte müssen von Note 1 zu Note 5 kleiner werden.</p>{/if}

    <div class="presets">
      <span class="muted small">Vorlagen:</span>
      {#each KEY_PRESETS as p}
        <button class="btn ghost small" onclick={() => (k.percents = [...p.percents])}>{p.name}</button>
      {/each}
    </div>
  </section>

  <section class="card">
    <h2>Notenschlüssel für {fmt(k.total)} BE</h2>
    <table>
      <thead><tr><th>Note</th><th>Punkte</th><th>ab %</th></tr></thead>
      <tbody>
        {#each rows as r}
          <tr class:hit={result === r.grade}>
            <td><strong>{r.grade}</strong></td>
            <td>{r.empty ? '–' : `${fmt(r.from)} – ${fmt(r.to)}`}</td>
            <td class="muted">{r.grade <= 5 ? fmt(k.percents[r.grade - 1]) : '–'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <label class="field check">Punkte prüfen
      <span class="probe">
        <input type="number" min="0" step="0.5" bind:value={points} placeholder="z. B. 31,5" />
        {#if result}<span>ergibt Note <strong>{result}</strong></span>{/if}
      </span>
    </label>
  </section>
</div>

<style>
  .wrap {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 1.25rem;
    max-width: 1050px;
    align-items: start;
  }
  section {
    display: grid;
    gap: 1rem;
  }
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }
  input[type='number'] {
    font: inherit;
    padding: 0.5rem 0.6rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    width: 100%;
  }
  .percents {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.4rem;
  }
  .percents label {
    display: grid;
    gap: 0.2rem;
    font-weight: 400;
  }
  .pct {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .percents input {
    padding: 0.4rem;
    min-width: 0;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.2rem;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th {
    text-align: left;
    font-size: 0.85rem;
    color: var(--muted);
    font-weight: 500;
    padding: 0 0.6rem 0.4rem;
  }
  td {
    padding: 0.5rem 0.6rem;
    border-top: 1px solid var(--line);
  }
  tr.hit td {
    background: var(--accent-soft);
  }
  .probe {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-weight: 400;
  }
  .probe input {
    max-width: 140px;
  }
</style>
