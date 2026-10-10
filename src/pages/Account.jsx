import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ArrowUpRight, Clock, Keyboard, LogOut, Monitor, Moon, RefreshCw, Server, Sun } from "lucide-react";
import { API_BASE_URL, authService } from "../api";
import { Avatar, DeptChip, Kbd, RoleBadge, Segmented } from "../components/ui";
import { useData, useTheme, useToast } from "../lib/contexts";
import { decodeToken } from "../lib/session";
import { formatCountdown, studentCode, timeOfDay } from "../lib/format";

function formatStamp(date) {
  return date
    ? date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" })
    : "—";
}

export default function Account() {
  const navigate = useNavigate();
  const { openShortcuts } = useOutletContext();
  const { toast } = useToast();
  const { me, currentUser, isAdmin, deptColor, status, latency, syncedAt, refresh, refreshing } = useData();
  const { system, pinned, setTheme } = useTheme();
  const [session] = useState(() => decodeToken());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const lifetime = session?.expiresAt && session?.issuedAt ? session.expiresAt - session.issuedAt : 0;
  const remaining = session?.expiresAt ? session.expiresAt - now : 0;
  const fraction = lifetime ? Math.max(0, Math.min(1, remaining / lifetime)) : 0;
  const opposite = system === "dark" ? "light" : "dark";

  const signOut = () => {
    authService.logout();
    navigate("/", { replace: true, viewTransition: true });
    toast({ tone: "info", title: "Signed out", description: "Your session has been closed on this device." });
  };

  const name = me?.name || currentUser?.email;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Account &amp; session</h1>
          <p className="page-desc">Your profile, active session and workspace preferences.</p>
        </div>
      </header>

      <div className="account-grid">
        <section className="card" aria-labelledby="profile-title">
          <div className="card-header">
            <h2 className="card-title" id="profile-title">
              Profile
            </h2>
            {me && (
              <button
                type="button"
                className="card-link"
                onClick={() => navigate(`/dashboard/students?student=${me.id}`, { viewTransition: true })}
              >
                Open record <ArrowUpRight aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="card-body">
            <div className="profile-head">
              <Avatar name={name} seed={currentUser?.email} size="xl" />
              <div style={{ minWidth: 0 }}>
                <p className="profile-name truncate">{name}</p>
                <p className="profile-sub truncate">{currentUser?.email}</p>
                <div className="profile-badges">
                  <RoleBadge role={isAdmin ? "ADMIN" : "STUDENT"} />
                  {me && <DeptChip code={me.departmentCode} name={me.departmentName} color={deptColor(me.departmentId)} />}
                </div>
              </div>
            </div>
            <dl className="props" style={{ marginTop: 20 }}>
              <dt>Enrollment ID</dt>
              <dd className="mono">{currentUser?.id != null ? studentCode(currentUser.id) : "—"}</dd>
              <dt>Access</dt>
              <dd>{isAdmin ? "Administrator — full read & write" : "Student — read-only"}</dd>
            </dl>
          </div>
        </section>

        <section className="card" aria-labelledby="session-title">
          <div className="card-header">
            <div>
              <h2 className="card-title" id="session-title">
                Current session
              </h2>
              <p className="card-desc">Signed JWT stored on this device</p>
            </div>
            <span className="badge badge-success">
              <Clock aria-hidden="true" /> Active
            </span>
          </div>
          <div className="card-body">
            <div className="session-clock-wrap">
              <div>
                <p className="stat-mini-label">Expires in</p>
                <p className="session-clock tnum" style={{ marginTop: 6 }}>
                  {session?.expiresAt ? formatCountdown(remaining) : "—"}
                </p>
              </div>
              <div
                className="meter"
                role="meter"
                aria-label="Session time remaining"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(fraction * 100)}
              >
                <span style={{ width: `${fraction * 100}%`, transition: "width 1s linear" }} />
              </div>
            </div>
            <dl className="props" style={{ marginTop: 18 }}>
              <dt>Issued</dt>
              <dd>{formatStamp(session?.issuedAt)}</dd>
              <dt>Expires</dt>
              <dd>{formatStamp(session?.expiresAt)}</dd>
              <dt>Algorithm</dt>
              <dd className="mono">{session?.algorithm ?? "—"}</dd>
            </dl>
            <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: 16 }} onClick={signOut}>
              <LogOut aria-hidden="true" /> Sign out of this device
            </button>
          </div>
        </section>

        <section className="card account-span" aria-labelledby="prefs-title">
          <div className="card-header">
            <h2 className="card-title" id="prefs-title">
              Workspace preferences
            </h2>
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="settings-row">
              <div>
                <p className="settings-row-label">Appearance</p>
                <p className="settings-row-desc">
                  Follow your system ({system}) or keep EduTrack in {opposite} mode.
                </p>
              </div>
              <Segmented
                label="Appearance"
                value={pinned ? "pinned" : "system"}
                onChange={(v) => setTheme(v === "system" ? system : opposite)}
                options={[
                  { value: "system", label: "Match system", icon: Monitor },
                  { value: "pinned", label: `Always ${opposite}`, icon: opposite === "dark" ? Moon : Sun },
                ]}
              />
            </div>
            <div className="settings-row">
              <div>
                <p className="settings-row-label">Keyboard shortcuts</p>
                <p className="settings-row-desc">
                  Press <Kbd>?</Kbd> anywhere to see every shortcut.
                </p>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={openShortcuts}>
                <Keyboard aria-hidden="true" /> View shortcuts
              </button>
            </div>
            <div className="settings-row">
              <div>
                <p className="settings-row-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Server width={14} height={14} className="subtle" aria-hidden="true" /> API connection
                </p>
                <p className="settings-row-desc">
                  <span className="mono">{API_BASE_URL}</span> ·{" "}
                  {status === "ready"
                    ? `responding in ${latency} ms${syncedAt ? ` · synced ${timeOfDay(syncedAt)}` : ""}`
                    : status === "loading"
                      ? "connecting…"
                      : "not responding"}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={refreshing}
                onClick={async () => {
                  const ok = await refresh();
                  toast(ok ? { title: "Connection healthy", description: "Data re-synced from the API." } : { tone: "error", title: "API unreachable" });
                }}
              >
                <RefreshCw className={refreshing ? "spin" : undefined} aria-hidden="true" /> Test &amp; sync
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
