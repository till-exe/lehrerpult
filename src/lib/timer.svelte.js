// Timer-Zustand außerhalb der Seite: läuft weiter beim Seitenwechsel und beim Sperren der App.
import { api } from './api.js';
import { app } from './store.svelte.js';
import { chime } from './session.svelte.js';

export const timer = $state({
  mode: 'timer', // timer | phasen | stoppuhr
  running: false,
  finished: false,
  sound: true,
  total: 300,
  remaining: 300,
  phaseIndex: 0,
  phases: [], // Kopie der Phasen, damit sie auch bei gesperrter App bekannt sind
  elapsed: 0,
});

let tick = null;
let endAt = 0;
let startedAt = 0;

export const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Solange der Timer läuft, bleibt der Bildschirm an.
function setRunning(on) {
  timer.running = on;
  api.keepAwake?.(on);
}

export function stop() {
  clearInterval(tick);
  if (timer.running) setRunning(false);
}

export function set(seconds) {
  stop();
  timer.total = timer.remaining = Math.max(0, Math.round(seconds));
  timer.finished = false;
}

function currentPhases() {
  return app.data?.settings.timerPhases ?? timer.phases;
}

export function loadPhase(i) {
  timer.phases = JSON.parse(JSON.stringify(currentPhases()));
  timer.phaseIndex = i;
  set((Number(timer.phases[i]?.minutes) || 0) * 60);
}

export function switchMode(m) {
  stop();
  timer.mode = m;
  timer.finished = false;
  if (m === 'phasen') loadPhase(0);
  if (m === 'timer') set(5 * 60);
  if (m === 'stoppuhr') timer.elapsed = 0;
}

export function start() {
  timer.finished = false;
  if (timer.mode === 'stoppuhr') {
    startedAt = Date.now() - timer.elapsed * 1000;
    setRunning(true);
    tick = setInterval(() => (timer.elapsed = (Date.now() - startedAt) / 1000), 100);
    return;
  }
  if (timer.remaining <= 0) return;
  if (timer.mode === 'phasen') timer.phases = JSON.parse(JSON.stringify(currentPhases()));
  endAt = Date.now() + timer.remaining * 1000;
  setRunning(true);
  tick = setInterval(update, 200);
}

function update() {
  timer.remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  if (timer.remaining > 0) return;
  stop();
  if (timer.mode === 'phasen' && timer.phaseIndex < timer.phases.length - 1) {
    if (timer.sound) chime(2);
    timer.phaseIndex++;
    timer.total = timer.remaining = (Number(timer.phases[timer.phaseIndex]?.minutes) || 0) * 60;
    start();
  } else {
    timer.finished = true;
    if (timer.sound) chime();
  }
}

export function reset() {
  if (timer.mode === 'stoppuhr') {
    stop();
    timer.elapsed = 0;
  } else if (timer.mode === 'phasen') loadPhase(0);
  else set(timer.total);
}
