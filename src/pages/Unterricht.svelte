<script>
  import Timer from '../components/tools/Timer.svelte';
  import Wheel from '../components/tools/Wheel.svelte';
  import Random from '../components/tools/Random.svelte';
  import Noise from '../components/tools/Noise.svelte';
  import Qr from '../components/tools/Qr.svelte';
  import ClassPicker from '../components/ClassPicker.svelte';

  const TOOLS = [
    { id: 'timer', label: 'Timer', view: Timer },
    { id: 'rad', label: 'Glücksrad', view: Wheel, usesClass: true },
    { id: 'zufall', label: 'Zufall & Gruppen', view: Random, usesClass: true },
    { id: 'laut', label: 'Lautstärke', view: Noise },
    { id: 'qr', label: 'QR-Code', view: Qr },
  ];

  let tool = $state('timer');
  const current = $derived(TOOLS.find((t) => t.id === tool));
</script>

<header>
  <h1>Unterricht</h1>
  {#if current.usesClass}<ClassPicker />{/if}
</header>

<div class="tabs" role="tablist">
  {#each TOOLS as t}
    <button role="tab" aria-selected={tool === t.id} class:active={tool === t.id} onclick={() => (tool = t.id)}>{t.label}</button>
  {/each}
</div>

<div class="tool">
  {#key tool}
    <current.view />
  {/key}
</div>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.2rem;
    min-height: 2.6rem;
  }
  .tabs {
    display: flex;
    gap: 0.3rem;
    border-bottom: 1px solid var(--line);
    margin-bottom: 1.3rem;
  }
  .tabs button {
    border: none;
    background: none;
    padding: 0.55rem 0.9rem;
    color: var(--muted);
    font-weight: 500;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  .tabs button:hover {
    color: var(--text);
  }
  .tabs button.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
  .tool {
    max-width: 1100px;
  }
</style>
