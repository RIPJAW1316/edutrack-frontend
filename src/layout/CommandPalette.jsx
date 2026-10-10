import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  Keyboard,
  Landmark,
  LayoutGrid,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Sun,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { Dialog } from "../components/Dialog";
import { Avatar, Kbd } from "../components/ui";
import { useData, useTheme, useToast } from "../lib/contexts";
import { studentCode } from "../lib/format";

function matches(q, ...fields) {
  return fields.some((f) => String(f ?? "").toLowerCase().includes(q));
}

export function CommandPalette({ open, onClose, onOpenShortcuts, onSignOut }) {
  const navigate = useNavigate();
  const { students, departments, isAdmin, deptColor, refresh } = useData();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  const listRef = useRef(null);
  const baseId = useId().replace(/[^a-zA-Z0-9]/g, "");

  // Reset each time the palette opens
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setActive(0);
    }
  }

  const go = (to) => navigate(to, { viewTransition: true });

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nav = [
      { id: "nav-overview", label: "Overview", icon: LayoutGrid, keys: ["G", "O"], run: () => go("/dashboard") },
      { id: "nav-students", label: "Students", icon: Users, keys: ["G", "S"], run: () => go("/dashboard/students") },
      {
        id: "nav-departments",
        label: "Departments",
        icon: Landmark,
        keys: ["G", "D"],
        run: () => go("/dashboard/departments"),
      },
      { id: "nav-account", label: "Account & session", icon: UserRound, keys: ["G", "A"], run: () => go("/dashboard/account") },
    ].map((i) => ({ ...i, group: "Navigate", keywords: `go to open ${i.label}` }));

    const commands = [
      isAdmin && {
        id: "cmd-new-student",
        label: "Enroll new student",
        icon: UserPlus,
        keywords: "create add student enroll",
        run: () => go("/dashboard/students?new=1"),
        group: "Quick actions",
      },
      isAdmin && {
        id: "cmd-new-dept",
        label: "Create department",
        icon: Plus,
        keywords: "new add department faculty",
        run: () => go("/dashboard/departments?new=1"),
        group: "Quick actions",
      },
      {
        id: "cmd-theme",
        label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        icon: theme === "dark" ? Sun : Moon,
        keywords: "theme appearance dark light mode",
        run: () => toggleTheme(),
      },
      {
        id: "cmd-refresh",
        label: "Refresh data",
        icon: RefreshCw,
        keywords: "reload sync fetch",
        run: async () => {
          const ok = await refresh();
          toast(ok ? { title: "Data refreshed" } : { tone: "error", title: "Couldn't reach the API" });
        },
      },
      { id: "cmd-shortcuts", label: "Keyboard shortcuts", icon: Keyboard, keys: ["?"], keywords: "help keys", run: onOpenShortcuts },
      { id: "cmd-signout", label: "Sign out", icon: LogOut, keywords: "logout log out exit", run: onSignOut },
    ]
      .filter(Boolean)
      .map((i) => ({ group: "Commands", ...i }));

    if (!q) {
      const quick = commands.filter((i) => i.group === "Quick actions");
      return [...quick, ...nav, ...commands.filter((i) => i.group !== "Quick actions")];
    }

    const studentHits = students
      .filter((s) => matches(q, s.name, s.email, studentCode(s.id), s.departmentCode))
      .slice(0, 6)
      .map((s) => ({
        id: `stu-${s.id}`,
        group: "Students",
        label: s.name,
        sub: s.email,
        avatar: s,
        meta: studentCode(s.id),
        run: () => go(`/dashboard/students?student=${s.id}`),
      }));

    const deptHits = departments
      .filter((d) => matches(q, d.name, d.code))
      .slice(0, 5)
      .map((d) => ({
        id: `dept-${d.id}`,
        group: "Departments",
        label: d.name,
        sub: `${d.studentCount || 0} enrolled`,
        dept: d,
        meta: d.code,
        run: () => go(`/dashboard/departments?open=${d.id}`),
      }));

    return [
      ...studentHits,
      ...deptHits,
      ...nav.filter((i) => matches(q, i.label, i.keywords)),
      ...commands.filter((i) => matches(q, i.label, i.keywords)),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, students, departments, isAdmin, theme]);

  const safeActive = Math.min(active, Math.max(0, items.length - 1));

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${safeActive}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [safeActive, items]);

  const runItem = (item) => {
    if (!item) return;
    onClose();
    item.run?.();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((safeActive + 1) % Math.max(1, items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((safeActive - 1 + items.length) % Math.max(1, items.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runItem(items[safeActive]);
    }
  };

  let lastGroup = null;

  return (
    <Dialog open={open} onClose={onClose} variant="palette" label="Command menu">
      <div className="palette-input-row">
        <Search aria-hidden="true" />
        <input
          className="palette-input"
          placeholder="Search students, departments, or type a command…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={`${baseId}-list`}
          aria-activedescendant={items[safeActive] ? `${baseId}-${items[safeActive].id}` : undefined}
          aria-autocomplete="list"
          data-autofocus
          spellCheck={false}
        />
        <Kbd>Esc</Kbd>
      </div>

      <div className="palette-list" ref={listRef} role="listbox" id={`${baseId}-list`} aria-label="Results">
        {items.length === 0 ? (
          <div className="palette-empty">
            No results for “<strong>{query}</strong>”
          </div>
        ) : (
          items.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <div key={item.id} role="presentation">
                {header && (
                  <div className="palette-group" role="presentation">
                    {header}
                  </div>
                )}
                <div
                  id={`${baseId}-${item.id}`}
                  role="option"
                  aria-selected={index === safeActive}
                  data-index={index}
                  className="palette-item"
                  onMouseMove={() => index !== safeActive && setActive(index)}
                  onClick={() => runItem(item)}
                >
                  {item.avatar ? (
                    <Avatar name={item.avatar.name} seed={item.avatar.email} size="sm" />
                  ) : item.dept ? (
                    <span className="palette-tile">
                      <span className="dept-dot" style={{ "--c": deptColor(item.dept.id) }} />
                    </span>
                  ) : (
                    <span className="palette-tile">
                      <Icon aria-hidden="true" />
                    </span>
                  )}
                  <span className="palette-item-text">
                    <span className="truncate">{item.label}</span>
                    {item.sub && <span className="palette-item-sub truncate">{item.sub}</span>}
                  </span>
                  <span className="palette-meta">
                    {item.meta && <span className="mono">{item.meta}</span>}
                    {item.keys && (
                      <span className="kbd-group">
                        {item.keys.map((k) => (
                          <Kbd key={k}>{k}</Kbd>
                        ))}
                      </span>
                    )}
                    <span className="enter kbd">
                      <CornerDownLeft width={11} height={11} aria-hidden="true" />
                    </span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="palette-footer" aria-hidden="true">
        <span>
          <span className="kbd-group">
            <Kbd>
              <ArrowUp width={11} height={11} />
            </Kbd>
            <Kbd>
              <ArrowDown width={11} height={11} />
            </Kbd>
          </span>
          Navigate
        </span>
        <span>
          <Kbd>
            <CornerDownLeft width={11} height={11} />
          </Kbd>
          Open
        </span>
        <span className="brand">EduTrack command menu</span>
      </div>
    </Dialog>
  );
}
