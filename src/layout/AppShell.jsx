import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ChevronsUpDown,
  Eye,
  Keyboard,
  Landmark,
  LayoutGrid,
  LogOut,
  Menu as MenuIcon,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Sun,
  UserRound,
  Users,
} from "lucide-react";
import { authService } from "../api";
import { CommandPalette } from "./CommandPalette";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { Dialog } from "../components/Dialog";
import { Logo } from "../components/Logo";
import { Menu, MenuItem, MenuSeparator } from "../components/Menu";
import { ThemeToggle } from "../components/ThemeToggle";
import { Avatar, Kbd } from "../components/ui";
import { useData, useTheme, useToast } from "../lib/contexts";
import { originFromEvent } from "../lib/dom";
import { modKey, useHotkeys } from "../lib/hotkeys";
import { decodeToken } from "../lib/session";
import { timeOfDay } from "../lib/format";

const TITLES = {
  "/dashboard": "Overview",
  "/dashboard/students": "Students",
  "/dashboard/departments": "Departments",
  "/dashboard/account": "Account",
};

/** Signs the user out when the JWT expires (the API itself never rejects stale tokens). */
function useSessionWatch(onExpire) {
  const { toast } = useToast();

  useEffect(() => {
    const info = decodeToken();
    const timers = [];
    const check = () => {
      const left = info?.expiresAt ? info.expiresAt.getTime() - Date.now() : Infinity;
      if (left <= 0) onExpire();
      return left;
    };

    const left = check();
    if (Number.isFinite(left) && left > 0) {
      const warnIn = left - 2 * 60 * 1000;
      if (warnIn > 0) {
        timers.push(
          setTimeout(
            () =>
              toast({
                tone: "warning",
                title: "Session ending soon",
                description: "You'll be signed out in 2 minutes. Save any open changes.",
                duration: 10000,
              }),
            warnIn
          )
        );
      }
      timers.push(setTimeout(onExpire, left));
    }

    const onVisible = () => document.visibilityState === "visible" && check();
    window.addEventListener("edutrack:unauthorized", onExpire);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("edutrack:unauthorized", onExpire);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [onExpire, toast]);
}

function ApiStatus() {
  const { status, latency, syncedAt } = useData();
  const state = status === "ready" ? "online" : status === "loading" ? "pending" : "offline";
  const label =
    status === "ready" ? "API connected" : status === "loading" ? "Connecting…" : status === "offline" ? "Connection lost" : "API offline";
  return (
    <div className="api-status" title={syncedAt ? `Last synced ${timeOfDay(syncedAt)}` : undefined}>
      <span className="status-dot" data-state={state} />
      <span>{label}</span>
      {status === "ready" && latency != null && <span className="tnum">{latency} ms</span>}
    </div>
  );
}

function Sidebar({ onOpenPalette, onOpenShortcuts, onSignOut, onNavigate }) {
  const { students, departments, me, currentUser, isAdmin, deptColor } = useData();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const activeDept = location.pathname === "/dashboard/students" ? params.get("dept") : null;
  const sortedDepts = [...departments].sort((a, b) => String(a.code).localeCompare(String(b.code)));
  const displayName = me?.name || currentUser?.email?.split("@")[0] || "Account";

  return (
    <nav className="sidebar" aria-label="Primary">
      <div className="sidebar-head">
        <Link to="/dashboard" viewTransition onClick={onNavigate} aria-label="EduTrack overview">
          <Logo size={26} />
        </Link>
      </div>

      <button type="button" className="search-trigger" onClick={onOpenPalette}>
        <Search aria-hidden="true" />
        <span>Search or jump to…</span>
        <span className="kbd-group" aria-hidden="true">
          <Kbd>{modKey}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="sidebar-scroll">
        <div className="nav">
          <NavLink to="/dashboard" end viewTransition className="nav-link" onClick={onNavigate}>
            <LayoutGrid aria-hidden="true" /> Overview
          </NavLink>
          <NavLink to="/dashboard/students" viewTransition className="nav-link" onClick={onNavigate}>
            <Users aria-hidden="true" /> Students
            <span className="nav-count">{students.length || ""}</span>
          </NavLink>
          <NavLink to="/dashboard/departments" viewTransition className="nav-link" onClick={onNavigate}>
            <Landmark aria-hidden="true" /> Departments
            <span className="nav-count">{departments.length || ""}</span>
          </NavLink>
        </div>

        {sortedDepts.length > 0 && (
          <div className="nav-section">
            <div className="nav-section-title">
              <span>Departments</span>
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  aria-label="Create department"
                  onClick={() => {
                    onNavigate?.();
                    navigate("/dashboard/departments?new=1", { viewTransition: true });
                  }}
                >
                  <Plus aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="nav">
              {sortedDepts.slice(0, 10).map((d) => (
                <Link
                  key={d.id}
                  to={`/dashboard/students?dept=${d.id}`}
                  viewTransition
                  className="nav-link nav-dept"
                  aria-current={activeDept === String(d.id) ? "page" : undefined}
                  onClick={onNavigate}
                  title={d.name}
                >
                  <span className="dept-dot" style={{ "--c": deptColor(d.id) }} aria-hidden="true" />
                  <span className="truncate">{d.name}</span>
                  <span className="nav-count">{d.studentCount || 0}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-foot">
        <ApiStatus />
        <Menu
          align="start"
          label="Account"
          trigger={(props) => (
            <button type="button" className="user-button" {...props}>
              <Avatar name={displayName} seed={currentUser?.email} size="sm" />
              <span className="user-meta">
                <span className="user-name truncate">{displayName}</span>
                <span className="user-sub truncate">{isAdmin ? "Administrator" : "Student"}</span>
              </span>
              <ChevronsUpDown aria-hidden="true" />
            </button>
          )}
        >
          <MenuItem
            icon={UserRound}
            onSelect={() => {
              onNavigate?.();
              navigate("/dashboard/account", { viewTransition: true });
            }}
          >
            Account &amp; session
          </MenuItem>
          <MenuItem icon={theme === "dark" ? Sun : Moon} onSelect={(e) => toggleTheme(originFromEvent(e))}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </MenuItem>
          <MenuItem icon={Keyboard} meta="?" onSelect={onOpenShortcuts}>
            Keyboard shortcuts
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={LogOut} onSelect={onSignOut}>
            Sign out
          </MenuItem>
        </Menu>
      </div>
    </nav>
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { refresh, refreshing, isAdmin } = useData();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const expire = useCallback(() => {
    authService.logout();
    const from = window.location.pathname + window.location.search;
    navigate("/", { replace: true, state: { reason: "expired", from } });
  }, [navigate]);
  useSessionWatch(expire);

  const signOut = useCallback(() => {
    authService.logout();
    navigate("/", { replace: true, viewTransition: true });
    toast({ tone: "info", title: "Signed out", description: "Your session has been closed on this device." });
  }, [navigate, toast]);

  const go = useCallback((to) => navigate(to, { viewTransition: true }), [navigate]);

  useHotkeys({
    "mod+k": () => setPaletteOpen((o) => !o),
    "?": () => setShortcutsOpen(true),
    "g o": () => go("/dashboard"),
    "g s": () => go("/dashboard/students"),
    "g d": () => go("/dashboard/departments"),
    "g a": () => go("/dashboard/account"),
  });

  const onRefresh = async () => {
    const ok = await refresh();
    toast(
      ok
        ? { tone: "success", title: "Data refreshed", description: "You're looking at the latest records." }
        : { tone: "error", title: "Couldn't refresh", description: "The API on localhost:8081 didn't respond." }
    );
  };

  const title = TITLES[location.pathname] ?? "EduTrack";
  const sidebarProps = {
    onOpenPalette: () => {
      setNavOpen(false);
      setPaletteOpen(true);
    },
    onOpenShortcuts: () => setShortcutsOpen(true),
    onSignOut: signOut,
  };

  return (
    <div className="shell">
      <Sidebar {...sidebarProps} />

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="btn btn-ghost btn-icon nav-toggle"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
          >
            <MenuIcon aria-hidden="true" />
          </button>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/dashboard" viewTransition>
              EduTrack
            </Link>
            <ChevronRight aria-hidden="true" />
            <strong aria-current="page">{title}</strong>
          </nav>
          <div className="topbar-actions">
            {!isAdmin && (
              <span className="read-only-pill" title="Student accounts have read-only access">
                <Eye aria-hidden="true" /> <span>Read-only</span>
              </span>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-icon topbar-search"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search"
            >
              <Search aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh data"
              data-tip="Refresh"
              data-tip-pos="bottom"
            >
              <RefreshCw className={refreshing ? "spin" : undefined} aria-hidden="true" />
            </button>
            <ThemeToggle tipPos="bottom" />
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => setShortcutsOpen(true)}
              aria-label="Keyboard shortcuts"
              data-tip="Shortcuts  ?"
              data-tip-pos="bottom"
            >
              <Keyboard aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="main-scroll" id="main">
          <Outlet context={{ openPalette: () => setPaletteOpen(true), openShortcuts: () => setShortcutsOpen(true) }} />
        </main>
      </div>

      <Dialog open={navOpen} onClose={() => setNavOpen(false)} variant="drawer" label="Navigation">
        <Sidebar {...sidebarProps} onNavigate={() => setNavOpen(false)} />
      </Dialog>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onSignOut={signOut}
      />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
