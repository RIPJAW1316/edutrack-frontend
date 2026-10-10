import { useRef, useState } from "react";
import { Check, ChevronDown, CircleAlert, Copy, GraduationCap, LoaderCircle, ShieldCheck } from "lucide-react";
import { avatarStyle, initials } from "../lib/format";
import { copyText } from "../lib/dom";

export function Avatar({ name, seed, size = "md", className = "" }) {
  const sizeClass = size === "md" ? "" : `avatar-${size}`;
  return (
    <span className={`avatar ${sizeClass} ${className}`} style={avatarStyle(seed ?? name)} aria-hidden="true">
      {initials(name, String(seed ?? "?"))}
    </span>
  );
}

export function AvatarStack({ people, max = 4 }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="avatar-stack" aria-hidden="true">
      {shown.map((p) => (
        <Avatar key={p.id} name={p.name} seed={p.email} size="sm" />
      ))}
      {rest > 0 && <span className="avatar-more">+{rest}</span>}
    </div>
  );
}

export function RoleBadge({ role }) {
  const admin = role === "ADMIN";
  return (
    <span className={`badge ${admin ? "badge-accent" : ""}`}>
      {admin ? <ShieldCheck aria-hidden="true" /> : <GraduationCap aria-hidden="true" />}
      {admin ? "Admin" : "Student"}
    </span>
  );
}

export function DeptChip({ code, name, color, showName = true }) {
  if (!code && !name) {
    return <span className="dept-chip dept-chip-empty">Unassigned</span>;
  }
  return (
    <span className="dept-chip" title={name}>
      <span className="dept-dot" style={{ "--c": color }} aria-hidden="true" />
      <span className="mono">{code || "—"}</span>
      {showName && name && <span className="dept-name">{name}</span>}
    </span>
  );
}

export function Kbd({ children }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function Spinner({ size = 15 }) {
  return <LoaderCircle className="spin" width={size} height={size} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="empty-icon">
          <Icon aria-hidden="true" />
        </div>
      )}
      <p className="empty-title">{title}</p>
      {description && <p className="empty-desc">{description}</p>}
      {children && <div className="empty-actions">{children}</div>}
    </div>
  );
}

export function Field({ label, htmlFor, hint, error, optional, aside, children }) {
  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          <span>
            {label} {optional && <span className="optional">(optional)</span>}
          </span>
          {aside}
        </label>
      )}
      {children}
      {error ? (
        <p className="field-error" id={htmlFor ? `${htmlFor}-error` : undefined} role="alert">
          <CircleAlert aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p className="field-hint" id={htmlFor ? `${htmlFor}-hint` : undefined}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function Select({ children, className = "", ...props }) {
  return (
    <span className="select-wrap">
      <select className={`select ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" />
    </span>
  );
}

/** Single-select segmented control with radiogroup semantics and arrow-key support. */
export function Segmented({ value, onChange, options, label, block = false, size }) {
  const groupRef = useRef(null);
  const onKeyDown = (e) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const index = options.findIndex((o) => o.value === value);
    const step = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
    const next = options[(index + step + options.length) % options.length];
    onChange(next.value);
    requestAnimationFrame(() => groupRef.current?.querySelector('[aria-checked="true"]')?.focus());
  };
  return (
    <div
      ref={groupRef}
      className={`segmented ${block ? "segmented-block" : ""}`}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      data-size={size}
    >
      {options.map((o) => {
        const Icon = o.icon;
        const checked = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(o.value)}
          >
            {Icon && <Icon aria-hidden="true" />}
            {o.label}
            {o.count != null && <span className="badge badge-count">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function CopyButton({ value, label = "Copy", className = "btn btn-ghost btn-icon btn-sm" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      aria-label={copied ? "Copied" : label}
      data-tip={copied ? "Copied" : label}
      onClick={async (e) => {
        e.stopPropagation();
        if (await copyText(value)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </button>
  );
}
