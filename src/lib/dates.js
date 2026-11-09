// Datumswerte werden als "JJJJ-MM-TT" in lokaler Zeit gespeichert.
const pad = (n) => String(n).padStart(2, '0');

export const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIso = (s) => new Date(`${s}T12:00:00`);
export const today = () => toIso(new Date());
export const addDays = (s, n) => {
  const d = fromIso(s);
  d.setDate(d.getDate() + n);
  return toIso(d);
};
export const daysBetween = (a, b) => Math.round((fromIso(b) - fromIso(a)) / 86400000);

// Montag = 1 … Sonntag = 7
export const weekday = (s) => ((fromIso(s).getDay() + 6) % 7) + 1;

export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];

const long = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const short = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' });
export const fmtLong = (s) => long.format(fromIso(s));
export const fmtShort = (s) => short.format(fromIso(s));

export function relativeLabel(s) {
  const d = daysBetween(today(), s);
  if (d === 0) return 'Heute';
  if (d === 1) return 'Morgen';
  if (d === -1) return 'Gestern';
  if (d > 1 && d < 7) return `In ${d} Tagen`;
  return '';
}
