import { Command, KeyRound, Layers, ShieldCheck, Users, WifiOff } from "lucide-react";
import { API_DOWN_HINT } from "../../api";
import { Logo } from "../../components/Logo";
import { ThemeToggle } from "../../components/ThemeToggle";

function Showcase({ departments, status }) {
  const sorted = [...departments].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0)).slice(0, 5);
  const max = Math.max(1, ...sorted.map((d) => d.studentCount || 0));
  const enrolled = departments.reduce((sum, d) => sum + (d.studentCount || 0), 0);

  return (
    <aside className="auth-aside" aria-label="About EduTrack">
      <div>
        <span className="showcase-kicker">
          <b>EduTrack</b> Campus operations platform
        </span>
        <h2 className="showcase-title">
          The operating system for the <em>modern</em> campus.
        </h2>
        <p className="showcase-lede">
          Students, departments and access control in one fast, keyboard-first workspace — backed by a
          Spring Boot API and signed JWT sessions.
        </p>
      </div>

      <div className="showcase-stage">
        <div className="glass stage-main">
          <div className="stage-head">
            <strong>Enrollment by department</strong>
            <span className="stage-live">
              <span className="status-dot" data-state={status === "ready" ? "online" : status === "error" ? "offline" : "pending"} />
              {status === "ready" ? "Live" : status === "error" ? "Offline" : "Connecting"}
            </span>
          </div>

          {status === "error" ? (
            <p className="stage-offline">
              <WifiOff aria-hidden="true" />
              <span>{API_DOWN_HINT}</span>
            </p>
          ) : (
            <div className="stage-bars">
              {(sorted.length ? sorted : Array.from({ length: 4 }, (_, i) => ({ id: `s${i}` }))).map((d) => (
                <div className="stage-bar" key={d.id}>
                  <span className="mono truncate">{d.code ?? "···"}</span>
                  <span className="stage-bar-track">
                    {d.code && (
                      <span
                        className="stage-bar-fill"
                        style={{ width: `${((d.studentCount || 0) / max) * 100}%`, display: "block" }}
                      />
                    )}
                  </span>
                  <span className="stage-bar-value">{d.code ? d.studentCount || 0 : ""}</span>
                </div>
              ))}
            </div>
          )}
          {status === "ready" && (
            <div className="stage-head" style={{ marginTop: 16 }}>
              <span>
                {departments.length} departments · {enrolled} assigned accounts
              </span>
            </div>
          )}
        </div>

        <div className="glass stage-float" aria-hidden="true">
          <div className="stage-float-row">
            <span className="stage-float-icon">
              <ShieldCheck />
            </span>
            <span>
              <strong>Signed JWT sessions</strong>
              <small>HS256 · 30-minute expiry</small>
            </span>
          </div>
          <div className="stage-chips">
            <span>Admin · full access</span>
            <span>Student · read</span>
          </div>
        </div>
      </div>

      <div className="showcase-features">
        <div className="feature">
          <Layers aria-hidden="true" />
          <h3>Unified records</h3>
          <p>Students and departments, linked and always in sync.</p>
        </div>
        <div className="feature">
          <KeyRound aria-hidden="true" />
          <h3>Role-aware access</h3>
          <p>Administrators manage; students get a read-only view.</p>
        </div>
        <div className="feature">
          <Command aria-hidden="true" />
          <h3>Keyboard-first</h3>
          <p>Jump anywhere with the command menu and shortcuts.</p>
        </div>
      </div>
    </aside>
  );
}

export function AuthLayout({ children, topAction, showcase }) {
  return (
    <div className="auth">
      <main className="auth-main">
        <header className="auth-top">
          <Logo />
          <div className="auth-top-actions">
            {topAction}
            <ThemeToggle tipPos="bottom" />
          </div>
        </header>
        <div className="auth-center">{children}</div>
        <footer className="auth-bottom">
          <span>© {new Date().getFullYear()} EduTrack</span>
          <span>
            <Users aria-hidden="true" /> Student &amp; department management
          </span>
        </footer>
      </main>
      <Showcase departments={showcase.departments} status={showcase.status} />
    </div>
  );
}
