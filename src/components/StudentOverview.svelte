<script>
  import X from '@lucide/svelte/icons/x';
  import Modal from './Modal.svelte';
  import { app } from '../lib/store.svelte.js';
  import { entriesOf, entryLabel } from '../lib/oral.js';
  import { FORGOT_KINDS, forgotOf, removeForgot } from '../lib/forgot.js';
  import { fmtShort } from '../lib/dates.js';
  import { classOf } from '../lib/timetable.js';

  let { studentId, onclose, onedit } = $props();

  const student = $derived(app.data.students.find((s) => s.id === studentId));
  const oral = $derived(student ? [...entriesOf(student.id)].reverse() : []);
  const grades = $derived(oral.filter((o) => o.grade).map((o) => Number(o.grade)));
  const avg = $derived(grades.length ? (grades.reduce((a, b) => a + b, 0) / grades.length).toLocaleString('de-DE', { maximumFractionDigits: 2 }) : null);
  const plus = $derived(oral.filter((o) => o.mark === '+').length);
  const minus = $derived(oral.filter((o) => o.mark === '−').length);
  const lists = $derived(student ? app.data.lists.filter((l) => l.classId === student.classId) : []);
</script>

{#if student}
  <Modal title="{student.firstName} {student.lastName}" {onclose} wide>
    <p class="muted small sub">Klasse {classOf(student.classId)?.name} · <button class="link small" onclick={() => onedit(student)}>Name bearbeiten oder entfernen</button></p>

    <div class="cols">
      <section>
        <h3>Mündlich</h3>
        <p class="stats">
          <span><strong>{plus}</strong> ×&nbsp;+</span>
          <span><strong>{minus}</strong> ×&nbsp;−</span>
          {#if avg}<span>Schnitt der {grades.length} {grades.length === 1 ? 'Note' : 'Noten'}: <strong>{avg}</strong></span>{/if}
        </p>
        {#if oral.length}
          <ul class="entries">
            {#each oral as o (o.id)}
              <li>
                <span class="muted">{fmtShort(o.date)}</span>
                <span class="lbl">{entryLabel(o)}</span>
                <span class="note">{o.note}</span>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="muted small">Noch keine Einträge.</p>
        {/if}
      </section>

      <section>
        <h3>Vergessen</h3>
        {#each FORGOT_KINDS as k}
          {@const list = forgotOf(student.id, k.id)}
          <div class="forgot">
            <span><strong>{list.length}</strong> × {k.label}</span>
            <span class="dates">
              {#each list as f (f.id)}
                <span class="chip">{fmtShort(f.date)}<button aria-label="Vermerk löschen" onclick={() => removeForgot(f.id)}><X size={12} /></button></span>
              {/each}
            </span>
          </div>
        {/each}

        {#if lists.length}
          <h3 class="gap">Listen</h3>
          <ul class="entries">
            {#each lists as l (l.id)}
              {@const e = l.entries[student.id]}
              <li>
                <span class="lbl">{l.name}</span>
                <span class:muted={!e?.checked}>{e?.checked ? 'abgehakt' : 'offen'}</span>
                <span class="note">{e?.note ?? ''}</span>
              </li>
            {/each}
          </ul>
        {/if}

        <h3 class="gap">Notiz</h3>
        <textarea rows="3" aria-label="Notiz" bind:value={student.note}></textarea>
      </section>
    </div>
    {#snippet actions()}
      <button class="btn primary" onclick={onclose}>Schließen</button>
    {/snippet}
  </Modal>
{/if}

<style>
  .sub {
    margin-top: -0.6rem;
  }
  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.6rem;
    align-items: start;
  }
  section {
    display: grid;
    gap: 0.5rem;
    min-width: 0;
  }
  .gap {
    margin-top: 0.7rem;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .entries {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 300px;
    overflow: auto;
    border-top: 1px solid var(--line);
  }
  .entries li {
    display: grid;
    grid-template-columns: auto auto 1fr;
    gap: 0.7rem;
    padding: 0.3rem 0.1rem;
    border-bottom: 1px solid var(--line);
    font-size: 0.92rem;
  }
  .lbl {
    font-weight: 600;
  }
  .note {
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .forgot {
    display: grid;
    gap: 0.3rem;
  }
  .dates {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.82rem;
    padding: 0.05rem 0.2rem 0.05rem 0.5rem;
    border-radius: 999px;
    background: var(--bg-side);
  }
  .chip button {
    border: none;
    background: none;
    color: var(--muted);
    padding: 0.1rem;
    display: flex;
  }
</style>
