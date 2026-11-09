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
