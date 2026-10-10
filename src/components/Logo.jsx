import { useId } from "react";

export function LogoMark({ size = 28 }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="logo-mark">
      <defs>
        <linearGradient id={`lg${id}`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7d7af7" />
          <stop offset="1" stopColor="#4642cf" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#lg${id})`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="#fff" strokeOpacity=".18" />
      <rect x="8" y="8.5" width="16" height="3.5" rx="1.75" fill="#fff" />
      <rect x="8" y="14.25" width="11" height="3.5" rx="1.75" fill="#fff" fillOpacity=".8" />
      <rect x="8" y="20" width="16" height="3.5" rx="1.75" fill="#fff" />
      <circle cx="23" cy="16" r="1.9" fill="#fff" fillOpacity=".8" />
    </svg>
  );
}

export function Logo({ size = 28, subtitle }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo-text">
        <span className="logo-name">EduTrack</span>
        {subtitle && <span className="logo-sub">{subtitle}</span>}
      </span>
    </span>
  );
}
