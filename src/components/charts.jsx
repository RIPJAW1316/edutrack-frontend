import { Link } from "react-router-dom";

/**
 * Horizontal bar list — one series, one hue, value labelled at the tip.
 * rows: [{ key, label, sublabel, value, to, muted, color }]
 */
export function BarList({ rows, total, unit = "student" }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="barlist">
      {rows.map((r, i) => {
        const width = `${(r.value / max) * 100}%`;
        const share = total ? Math.round((r.value / total) * 100) : 0;
        const Row = r.to ? Link : "div";
        const noun = r.value === 1 ? unit : `${unit}s`;
        return (
          <Row
            key={r.key}
            to={r.to}
            viewTransition={r.to ? true : undefined}
            className="barlist-row"
            aria-label={`${r.sublabel ?? r.label}: ${r.value} ${noun}, ${share}% of all accounts`}
          >
            <span className="barlist-label">
              {r.color && <span className="dept-dot" style={{ "--c": r.color }} aria-hidden="true" />}
              <span className="mono">{r.label}</span>
              {r.sublabel && <span className="truncate dept-name-long">{r.sublabel}</span>}
            </span>
            <span className="barlist-track" style={{ "--w": width }} aria-hidden="true">
              <span
                className="barlist-bar"
                data-muted={r.muted ? "true" : undefined}
                style={{ width, "--i": i }}
              />
              <span className="barlist-tip">
                <strong>{r.value}</strong> {noun} · {share}% of accounts
              </span>
            </span>
            <span className="barlist-value" aria-hidden="true">
              {r.value}
              <span>{share}%</span>
            </span>
          </Row>
        );
      })}
    </div>
  );
}

/** Part-to-whole bar with a legend (identity never relies on colour alone). */
export function SplitBar({ segments, label }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const visible = segments.filter((s) => s.value > 0);
  return (
    <figure>
      <div className="splitbar" role="img" aria-label={label}>
        {total === 0 ? (
          <span style={{ width: "100%", "--c": "var(--bg-active)" }} />
        ) : (
          visible.map((s) => (
            <span key={s.key} style={{ width: `${(s.value / total) * 100}%`, "--c": s.color }} />
          ))
        )}
      </div>
      <figcaption className="legend">
        {segments.map((s) => (
          <div className="legend-row" key={s.key}>
            <span className="legend-swatch" style={{ "--c": s.color }} aria-hidden="true" />
            <span>{s.label}</span>
            <span className="legend-value">
              {s.value}
              <span>{total ? Math.round((s.value / total) * 100) : 0}%</span>
            </span>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}
