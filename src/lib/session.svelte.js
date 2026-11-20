// Zustand, der nur während der laufenden Sitzung gilt (nicht gespeichert).
export const session = $state({
  absent: {}, // studentId → true
  folded: {}, // Stundenkarten auf der Startseite: "Datum|Stunde" → eingeklappt ja/nein
});

export const isPresent = (s) => !session.absent[s.id];

export function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Kurzer, angenehmer Signalton.
export function chime(times = 3) {
  const ctx = new AudioContext();
  for (let i = 0; i < times; i++) {
    const t = ctx.currentTime + i * 0.45;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.42);
  }
  setTimeout(() => ctx.close(), times * 450 + 500);
}
