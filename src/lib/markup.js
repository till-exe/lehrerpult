// Sehr einfache Formatierung für Notizen:
// "# " große Überschrift, "## " Überschrift, "- " Aufzählung, "- [ ] " / "- [x] " Checkbox.
export function parseNote(text) {
  return text.split('\n').map((line, i) => {
    let m;
    if ((m = line.match(/^## (.*)/))) return { type: 'h3', text: m[1], line: i };
    if ((m = line.match(/^# (.*)/))) return { type: 'h2', text: m[1], line: i };
    if ((m = line.match(/^\s*[-*] \[( |x|X)\] ?(.*)/))) return { type: 'check', checked: m[1] !== ' ', text: m[2], line: i };
    if ((m = line.match(/^\s*[-*] (.*)/))) return { type: 'bullet', text: m[1], line: i };
    if (!line.trim()) return { type: 'gap', line: i };
    return { type: 'p', text: line, line: i };
  });
}

export function toggleCheck(text, lineNr) {
  const lines = text.split('\n');
  lines[lineNr] = lines[lineNr].replace(/\[( |x|X)\]/, (_, c) => (c === ' ' ? '[x]' : '[ ]'));
  return lines.join('\n');
}

// "==Text==" wird markiert dargestellt.
export function inline(text) {
  return text.split(/(==[^=]+==)/g).filter(Boolean).map((t) => (/^==[^=]+==$/.test(t) ? { t: t.slice(2, -2), mark: true } : { t, mark: false }));
}

// Markierung um einen Bereich setzen oder, wenn schon markiert, entfernen.
export function toggleMark(text, start, end) {
  if (text.slice(start - 2, start) === '==' && text.slice(end, end + 2) === '==')
    return { text: text.slice(0, start - 2) + text.slice(start, end) + text.slice(end + 2), start: start - 2, end: end - 2 };
  return { text: text.slice(0, start) + '==' + text.slice(start, end) + '==' + text.slice(end), start: start + 2, end: end + 2 };
}

// Position eines Zeilenanfangs im Gesamttext.
export function lineOffset(text, lineNr) {
  let pos = 0;
  for (let i = 0; i < lineNr; i++) pos = text.indexOf('\n', pos) + 1;
  return pos;
}
