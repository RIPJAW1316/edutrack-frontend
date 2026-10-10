// Small DOM helpers.

// Extracts a click origin (used by the theme reveal animation).
export function originFromEvent(e) {
  if (!e) return undefined;
  if (e.clientX || e.clientY) return { x: e.clientX, y: e.clientY };
  const rect = e.currentTarget?.getBoundingClientRect?.();
  return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
