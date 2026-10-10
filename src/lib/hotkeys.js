import { useEffect, useRef } from "react";

export const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export const modKey = isMac ? "⌘" : "Ctrl";

function isEditable(el) {
  if (!el) return false;
  const tag = el.tagName;
  return el.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function overlayOpen() {
  return !!document.querySelector("dialog[open]");
}

/**
 * Global keyboard shortcuts.
 * bindings: { "mod+k": fn, "/": fn, "c": fn, "g s": fn, "?": fn }
 * Single keys and sequences are ignored while typing or while a dialog is open;
 * "mod+" combos always fire.
 */
export function useHotkeys(bindings, enabled = true) {
  const ref = useRef(bindings);

  useEffect(() => {
    ref.current = bindings;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    let pending = null;
    let timer = 0;

    const onKeyDown = (e) => {
      const map = ref.current;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && !e.altKey) {
        const handler = map[`mod+${key}`];
        if (handler) {
          e.preventDefault();
          handler(e);
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(e.target) || overlayOpen()) return;

      if (pending) {
        const handler = map[`${pending} ${key}`];
        pending = null;
        clearTimeout(timer);
        if (handler) {
          e.preventDefault();
          handler(e);
          return;
        }
      }

      const startsSequence = Object.keys(map).some((k) => k.startsWith(`${key} `));
      if (startsSequence) {
        pending = key;
        timer = window.setTimeout(() => (pending = null), 900);
        return;
      }

      const handler = map[e.key] || map[key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(timer);
    };
  }, [enabled]);
}
