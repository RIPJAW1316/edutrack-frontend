import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import { ToastContext } from "../lib/contexts";

const ICONS = { success: Check, error: CircleAlert, info: Info, warning: TriangleAlert };
const supportsPopover = typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype;

function ToastItem({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);
  const Icon = ICONS[toast.tone] ?? Info;

  useEffect(() => {
    if (paused || toast.leaving || toast.duration === Infinity) return undefined;
    const id = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(id);
  }, [paused, toast, onDismiss]);

  return (
    <li
      className="toast"
      data-tone={toast.tone}
      data-leaving={toast.leaving ? "true" : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="toast-icon" aria-hidden="true">
        <Icon strokeWidth={2.5} />
      </span>
      <div className="toast-content">
        <p className="toast-title">{toast.title}</p>
        {toast.description && <p className="toast-desc">{toast.description}</p>}
      </div>
      <button type="button" className="toast-close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
        <X />
      </button>
    </li>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const regionRef = useRef(null);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 200);
  }, []);

  const toast = useCallback((input) => {
    const opts = typeof input === "string" ? { title: input } : input;
    const id = ++counter.current;
    const item = { id, tone: "success", duration: 4500, ...opts };
    setToasts((list) => [...list.slice(-3), item]);
    return id;
  }, []);

  // The region lives in the top layer so toasts render above modal dialogs.
  useEffect(() => {
    const region = regionRef.current;
    if (!supportsPopover || !region) return;
    try {
      if (!region.matches(":popover-open")) region.showPopover();
    } catch {
      /* already shown */
    }
  }, []);

  // A modal opened after the region sits above it — re-raise when a new toast arrives.
  const lastCount = useRef(0);
  useEffect(() => {
    const region = regionRef.current;
    const grew = toasts.length > lastCount.current;
    lastCount.current = toasts.length;
    if (!supportsPopover || !region || !grew) return;
    if (!document.querySelector("dialog[open]")) return;
    try {
      region.hidePopover();
      region.showPopover();
    } catch {
      /* ignore */
    }
  }, [toasts.length]);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section
        ref={regionRef}
        className="toaster"
        popover={supportsPopover ? "manual" : undefined}
        aria-label="Notifications"
      >
        <ol aria-live="polite" aria-relevant="additions">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </ol>
      </section>
    </ToastContext.Provider>
  );
}
