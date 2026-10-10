import { useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { ThemeContext } from "../lib/contexts";

const STORAGE_KEY = "edutrack-theme";
const query = "(prefers-color-scheme: dark)";

function readPinned() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function writePinned(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — preference lasts for this session only */
  }
}

function applyToDocument(theme, pinned) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.content = pinned ?? "light dark";
}

/**
 * Two-state theme model: follow the system, or pin the opposite.
 * Choosing the scheme the system already uses clears the pin.
 */
export function ThemeProvider({ children }) {
  const [pinned, setPinned] = useState(readPinned);
  const [system, setSystem] = useState(() => (matchMedia(query).matches ? "dark" : "light"));
  const theme = pinned ?? system;

  useEffect(() => {
    const mq = matchMedia(query);
    const onChange = (e) => setSystem(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    applyToDocument(theme, pinned);
  }, [theme, pinned]);

  const setTheme = useCallback(
    (next, origin) => {
      const nextPinned = next === system ? null : next;
      const commit = () => {
        writePinned(nextPinned);
        applyToDocument(next, nextPinned);
        flushSync(() => setPinned(nextPinned));
      };

      const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!document.startViewTransition || reduceMotion) {
        commit();
        return;
      }

      const root = document.documentElement;
      const x = origin?.x ?? window.innerWidth - 40;
      const y = origin?.y ?? 40;
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      root.style.setProperty("--vt-x", `${x}px`);
      root.style.setProperty("--vt-y", `${y}px`);
      root.style.setProperty("--vt-r", `${r}px`);
      root.classList.add("theme-transition");
      const transition = document.startViewTransition(commit);
      transition.finished.finally(() => root.classList.remove("theme-transition"));
    },
    [system]
  );

  const toggleTheme = useCallback(
    (origin) => setTheme(theme === "dark" ? "light" : "dark", origin),
    [theme, setTheme]
  );

  const value = useMemo(
    () => ({ theme, system, pinned, setTheme, toggleTheme }),
    [theme, system, pinned, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
