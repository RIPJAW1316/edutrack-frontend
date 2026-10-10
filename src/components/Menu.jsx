import { useEffect, useId, useRef, useState } from "react";

/**
 * Dropdown menu on the Popover API (top layer + light dismiss for free).
 * `trigger` is a render prop that receives the props to spread on the button.
 */
export function Menu({ trigger, children, align = "end", label, className = "" }) {
  const reactId = useId();
  const menuId = `menu${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return undefined;

    const place = () => {
      const t = triggerRef.current?.getBoundingClientRect();
      if (!t) return;
      menu.style.top = `${t.bottom + 4}px`;
      if (align === "end") {
        menu.style.left = "auto";
        menu.style.right = `${Math.max(8, window.innerWidth - t.right)}px`;
        menu.style.setProperty("--menu-origin", "top right");
      } else {
        menu.style.right = "auto";
        menu.style.left = `${Math.max(8, t.left)}px`;
        menu.style.setProperty("--menu-origin", "top left");
      }
    };

    const flipIfNeeded = () => {
      const t = triggerRef.current?.getBoundingClientRect();
      const m = menu.getBoundingClientRect();
      if (t && m.bottom > window.innerHeight - 8) {
        menu.style.top = `${Math.max(8, t.top - m.height - 4)}px`;
        menu.style.setProperty("--menu-origin", align === "end" ? "bottom right" : "bottom left");
      }
    };

    const close = (e) => {
      if (e?.target instanceof Node && menu.contains(e.target)) return;
      if (menu.matches(":popover-open")) menu.hidePopover();
    };

    const onBeforeToggle = (e) => {
      if (e.newState === "open") place();
    };

    const onToggle = (e) => {
      const isOpen = e.newState === "open";
      setOpen(isOpen);
      if (isOpen) {
        flipIfNeeded();
        menu.querySelector('[role^="menuitem"]:not(:disabled)')?.focus({ preventScroll: true });
        window.addEventListener("resize", close);
        window.addEventListener("scroll", close, true);
      } else {
        window.removeEventListener("resize", close);
        window.removeEventListener("scroll", close, true);
      }
    };

    menu.addEventListener("beforetoggle", onBeforeToggle);
    menu.addEventListener("toggle", onToggle);
    return () => {
      menu.removeEventListener("beforetoggle", onBeforeToggle);
      menu.removeEventListener("toggle", onToggle);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [align]);

  const onKeyDown = (e) => {
    const items = [...menuRef.current.querySelectorAll('[role^="menuitem"]:not(:disabled)')];
    if (!items.length) return;
    const index = items.indexOf(document.activeElement);
    let next = null;
    if (e.key === "ArrowDown") next = items[(index + 1) % items.length];
    else if (e.key === "ArrowUp") next = items[(index - 1 + items.length) % items.length];
    else if (e.key === "Home") next = items[0];
    else if (e.key === "End") next = items[items.length - 1];
    else if (e.key === "Tab") menuRef.current.hidePopover();
    if (next) {
      e.preventDefault();
      next.focus();
    }
  };

  return (
    <>
      {trigger({
        ref: triggerRef,
        popoverTarget: menuId,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": menuId,
        onClick: (e) => e.stopPropagation(),
      })}
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        aria-label={label}
        className={`menu ${className}`}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}

export function MenuItem({ icon: Icon, children, onSelect, tone, meta, disabled, checked }) {
  const role = checked === undefined ? "menuitem" : "menuitemradio";
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      className="menu-item"
      data-tone={tone}
      disabled={disabled}
      onClick={(e) => {
        e.currentTarget.closest("[popover]")?.hidePopover();
        onSelect?.(e);
      }}
    >
      {Icon && <Icon aria-hidden="true" />}
      <span className="truncate">{children}</span>
      {meta && <span className="menu-meta">{meta}</span>}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="menu-sep" role="separator" />;
}

export function MenuLabel({ children }) {
  return <div className="menu-label">{children}</div>;
}
