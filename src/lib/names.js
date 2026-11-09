// Liest eingefügte Namenslisten (aus Excel, Word oder Text) ein.
// order: 'last-first' (Nachname zuerst) oder 'first-last' (Vorname zuerst).
export function parseNames(text, order = 'last-first') {
  const out = [];
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.replace(/^\s*\d+[.)]?\s+/, '').trim(); // Nummerierung "1." oder "1)" entfernen
    if (!line) continue;
    let first = '';
    let last = '';
    if (line.includes('\t')) {
      const cols = line.split('\t').map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 2) [first, last] = order === 'last-first' ? [cols[1], cols[0]] : [cols[0], cols[1]];
      else line = cols[0] ?? '';
    }
    if (!first && !last && line.includes(',')) {
      const [a, ...rest] = line.split(',');
      last = a.trim();
      first = rest.join(',').trim();
    } else if (!first && !last) {
      const parts = line.split(/\s+/);
      if (parts.length === 1) last = parts[0];
      else if (order === 'last-first') [last, first] = [parts[0], parts.slice(1).join(' ')];
      else [first, last] = [parts.slice(0, -1).join(' '), parts.at(-1)];
    }
    if (first || last) out.push({ firstName: first, lastName: last });
  }
  return out;
}

export const fullName = (s) => [s.firstName, s.lastName].filter(Boolean).join(' ');

const collator = new Intl.Collator('de');
export const byName = (a, b) => collator.compare(a.lastName, b.lastName) || collator.compare(a.firstName, b.firstName);

export const sameName = (a, b) =>
  a.firstName.toLowerCase() === b.firstName.toLowerCase() && a.lastName.toLowerCase() === b.lastName.toLowerCase();
