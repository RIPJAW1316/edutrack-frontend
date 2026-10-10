import { useEffect, useRef } from "react";

const supportsClosedBy =
  typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype;

/**
 * Native modal <dialog>: top layer, focus trap, Esc and (optionally) light dismiss.
 * Stays mounted so exit transitions can play; `open` drives showModal()/close().
 * Mark the element that should receive focus with data-autofocus.
 */
export function Dialog({
  open,
  onClose,
  variant = "modal",
  dismissible = true,
  label,
  labelledBy,
  describedBy,
  className = "",
  children,
}) {
  const ref = useRef(null);
  const latest = useRef({ open, onClose });

  useEffect(() => {
    latest.current = { open, onClose };
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      const target = el.querySelector("[data-autofocus]");
      if (target) requestAnimationFrame(() => target.focus({ preventScroll: true }));
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    ref.current?.setAttribute("closedby", dismissible ? "any" : "closerequest");
  }, [dismissible]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const handleClose = () => {
      if (latest.current.open) latest.current.onClose?.();
    };
    el.addEventListener("close", handleClose);
    return () => el.removeEventListener("close", handleClose);
  }, []);

  // Light-dismiss fallback for browsers without <dialog closedby>.
  const handleClick = (e) => {
    if (!dismissible || supportsClosedBy) return;
    const el = ref.current;
    if (e.target !== el) return;
    const r = el.getBoundingClientRect();
    const inside = r.top <= e.clientY && e.clientY <= r.bottom && r.left <= e.clientX && e.clientX <= r.right;
    if (!inside) el.close();
  };

  return (
    <dialog
      ref={ref}
      className={`dialog dialog-${variant} ${className}`}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={handleClick}
    >
      {children}
    </dialog>
  );
}
