// Textfeld wächst mit dem Inhalt.
export function autosize(node) {
  const fit = () => {
    node.style.height = 'auto';
    node.style.height = node.scrollHeight + 2 + 'px';
  };
  queueMicrotask(fit);
  node.addEventListener('input', fit);
  return { update: () => queueMicrotask(fit), destroy: () => node.removeEventListener('input', fit) };
}
