import { app } from './store.svelte.js';
import { toIso, fromIso, addDays, weekday } from './dates.js';

// Ferien laut Bayerischem Kultusministerium, Schuljahr 2026/27.
export const BAVARIA_2026_27 = [
  { name: 'Herbstferien', from: '2026-11-02', to: '2026-11-06' },
  { name: 'Weihnachtsferien', from: '2026-12-24', to: '2027-01-08' },
  { name: 'Frühjahrsferien', from: '2027-02-08', to: '2027-02-12' },
  { name: 'Osterferien', from: '2027-03-22', to: '2027-04-02' },
  { name: 'Pfingstferien', from: '2027-05-18', to: '2027-05-28' },
  { name: 'Sommerferien', from: '2027-08-02', to: '2027-09-13' },
];

function easter(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return toIso(new Date(year, month - 1, day, 12));
}

// Gesetzliche Feiertage in Bayern und der unterrichtsfreie Buß- und Bettag.
const cache = {};
function publicHolidays(year) {
  if (cache[year]) return cache[year];
  const e = easter(year);
  let buss = `${year}-11-22`;
  while (weekday(buss) !== 3) buss = addDays(buss, -1);
  return (cache[year] = {
    [`${year}-01-01`]: 'Neujahr',
    [`${year}-01-06`]: 'Heilige Drei Könige',
    [addDays(e, -2)]: 'Karfreitag',
    [addDays(e, 1)]: 'Ostermontag',
    [`${year}-05-01`]: 'Tag der Arbeit',
    [addDays(e, 39)]: 'Christi Himmelfahrt',
    [addDays(e, 50)]: 'Pfingstmontag',
    [addDays(e, 60)]: 'Fronleichnam',
    [`${year}-08-15`]: 'Mariä Himmelfahrt',
    [`${year}-10-03`]: 'Tag der Deutschen Einheit',
    [`${year}-11-01`]: 'Allerheiligen',
    [buss]: 'Buß- und Bettag',
    [`${year}-12-25`]: '1. Weihnachtstag',
    [`${year}-12-26`]: '2. Weihnachtstag',
  });
}

// Name des freien Tages oder null.
export function freeDay(date) {
  const own = app.data.holidays.find((h) => h.from <= date && date <= (h.to || h.from));
  if (own) return own.name || 'Unterrichtsfrei';
  return publicHolidays(fromIso(date).getFullYear())[date] ?? null;
}
