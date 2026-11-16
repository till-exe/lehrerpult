<script>
  import { studentsOf } from '../lib/classes.js';
  import { FORGOT_KINDS, forgotOf, forgotToday, toggleForgot } from '../lib/forgot.js';
  import { fmtShort } from '../lib/dates.js';

  let { klass, onstudent } = $props();
  const students = $derived(studentsOf(klass.id));
</script>

<p class="muted small intro">Ein Klick vermerkt „heute vergessen“, ein zweiter nimmt es zurück. Die Zahl zählt alle Vermerke.</p>
<ul>
  {#each students as s (s.id)}
    {@const last = forgotOf(s.id)[0]}
    <li>
      <button class="name" onclick={() => onstudent(s)}><strong>{s.lastName}</strong>{s.firstName ? `, ${s.firstName}` : ''}</button>
      {#each FORGOT_KINDS as k}
        {@const n = forgotOf(s.id, k.id).length}
        <button class="mark" class:on={forgotToday(s.id, k.id)} onclick={() => toggleForgot(s, k.id)} title="{k.label} heute vergessen">
          {k.short}<span class="n" class:zero={n === 0}>{n}</span>
        </button>
      {/each}
      <span class="muted small">{last ? `zuletzt ${fmtShort(last.date)}` : ''}</span>
    </li>
  {:else}
    <li class="muted">In {klass.name} sind noch keine Schüler eingetragen.</li>
  {/each}
</ul>

<style>
  .intro {
    margin-bottom: 0.7rem;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    max-width: 820px;
    border-top: 1px solid var(--line);
  }
  li {
    display: grid;
    grid-template-columns: 1fr auto auto 130px;
    align-items: center;
    gap: 0.6rem;
    padding: 0.3rem 0.3rem;
    border-bottom: 1px solid var(--line);
  }
  .name {
    border: none;
    background: none;
    text-align: left;
    padding: 0.3rem 0.4rem;
    border-radius: var(--radius-sm);
    color: var(--text);
  }
  .name:hover {
    background: var(--bg-soft);
  }
  .name strong {
    font-weight: 600;
  }
  .mark {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid var(--line-strong);
    background: #fff;
    border-radius: var(--radius-sm);
    padding: 0.25rem 0.6rem;
    font-size: 0.88rem;
    min-width: 6.2rem;
    justify-content: space-between;
  }
  .mark:hover {
    background: var(--bg-soft);
  }
  .mark.on {
    border-color: var(--warn);
    background: var(--warn-soft);
    color: var(--warn);
  }
  .n {
    font-weight: 700;
  }
  .n.zero {
    color: var(--line-strong);
    font-weight: 500;
  }
</style>
