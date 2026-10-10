import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Ellipsis, Eye, Landmark, Pencil, Plus, RefreshCw, Search, SearchX, ServerCrash, Trash, Users } from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DepartmentSheet } from "../components/DepartmentSheet";
import { Menu, MenuItem, MenuSeparator } from "../components/Menu";
import { AvatarStack, EmptyState, Kbd, Select } from "../components/ui";
import { API_DOWN_HINT } from "../api";
import { useData, useToast } from "../lib/contexts";
import { useHotkeys } from "../lib/hotkeys";
import { compareText, errorMessage, pluralize } from "../lib/format";

const SORTS = {
  size: { label: "Most students", fn: (a, b) => (b.studentCount || 0) - (a.studentCount || 0) || compareText(a.name, b.name) },
  name: { label: "Name A–Z", fn: (a, b) => compareText(a.name, b.name) },
  code: { label: "Code A–Z", fn: (a, b) => compareText(a.code, b.code) },
  newest: { label: "Newest first", fn: (a, b) => b.id - a.id },
};

function deleteCopy(dept) {
  const count = dept?.studentCount || 0;
  return count
    ? `${pluralize(count, "student")} will be unassigned — their accounts stay intact. This can't be undone.`
    : "This department has no students. This can't be undone.";
}

export default function Departments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { departments, students, status, refresh, isAdmin, deptColor, deptById, deleteDepartment } = useData();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("size");
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, dept: null });
  const searchRef = useRef(null);

  const openId = params.get("open");
  const creating = params.get("new") === "1" && isAdmin;

  const setParam = (patch, { push = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, String(v))));
    setParams(next, { replace: !push });
  };

  const openDept = (id, edit = false) => {
    setEditing(edit);
    setParam({ open: id, new: null }, { push: true });
  };
  const closeSheet = () => {
    setEditing(false);
    setParam({ open: null, new: null });
  };
  const startCreate = () => {
    setEditing(false);
    setParam({ new: 1, open: null }, { push: true });
  };

  useHotkeys({
    "/": () => searchRef.current?.focus(),
    c: () => isAdmin && startCreate(),
  });

  const membersByDept = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      if (!s.departmentId) return;
      if (!map.has(s.departmentId)) map.set(s.departmentId, []);
      map.get(s.departmentId).push(s);
    });
    return map;
  }, [students]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return departments
      .filter((d) => !q || [d.name, d.code, d.description].some((f) => String(f ?? "").toLowerCase().includes(q)))
      .sort(SORTS[sort].fn);
  }, [departments, query, sort]);

  const sheetDept = openId ? deptById.get(Number(openId)) : null;
  const sheetOpen = creating || !!openId;
  const sheetMode = creating ? "create" : editing && isAdmin ? "edit" : "view";

  const runDelete = async () => {
    const dept = confirm.dept;
    if (String(dept.id) === openId) closeSheet();
    try {
      await deleteDepartment(dept.id);
      toast({
        title: `${dept.code} deleted`,
        description: dept.studentCount ? `${pluralize(dept.studentCount, "student")} moved to Unassigned.` : undefined,
      });
    } catch (err) {
      toast({ tone: "error", title: "Couldn't delete department", description: errorMessage(err) });
      throw err;
    }
  };

  const loading = status === "loading";

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            Departments {!loading && <span className="badge badge-count">{departments.length}</span>}
          </h1>
          <p className="page-desc">Academic units, their enrollment and who belongs to each.</p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/dashboard/students", { viewTransition: true })}
          >
            <Users aria-hidden="true" /> Student directory
          </button>
          {isAdmin && (
            <button type="button" className="btn btn-primary" onClick={startCreate}>
              <Plus aria-hidden="true" /> New department <Kbd>C</Kbd>
            </button>
          )}
        </div>
      </header>

      <div className="toolbar">
        <span className="input-wrap toolbar-search">
          <Search className="input-lead" aria-hidden="true" />
          <input
            ref={searchRef}
            className="input"
            type="search"
            placeholder="Search departments"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search departments"
          />
          <span className="input-trail">{!query && <Kbd>/</Kbd>}</span>
        </span>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort departments">
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              Sort: {s.label}
            </option>
          ))}
        </Select>
        <span className="toolbar-spacer" />
        {!loading && (
          <span className="result-count">
            {query ? `${visible.length} of ${departments.length}` : pluralize(departments.length, "department")}
          </span>
        )}
      </div>

      {status === "error" ? (
        <div className="card">
          <EmptyState
            icon={ServerCrash}
            title="Can't load departments"
            description={API_DOWN_HINT}
          >
            <button type="button" className="btn btn-primary" onClick={refresh}>
              <RefreshCw aria-hidden="true" /> Retry
            </button>
          </EmptyState>
        </div>
      ) : loading ? (
        <div className="dept-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="dept-card" key={i} style={{ "--i": i }}>
              <span className="skeleton" style={{ width: 42, height: 42, borderRadius: 11 }} />
              <div style={{ display: "grid", gap: 8 }}>
                <span className="skeleton" style={{ width: "60%", height: 14 }} />
                <span className="skeleton" style={{ width: "90%" }} />
                <span className="skeleton" style={{ width: "70%" }} />
              </div>
              <div className="dept-card-foot">
                <span className="skeleton" style={{ width: "40%" }} />
                <span className="skeleton" style={{ height: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="card">
          <EmptyState icon={Landmark} title="No departments yet" description="Departments group students and power the directory filters.">
            {isAdmin && (
              <button type="button" className="btn btn-primary" onClick={startCreate}>
                <Plus aria-hidden="true" /> Create the first department
              </button>
            )}
          </EmptyState>
        </div>
      ) : visible.length === 0 ? (
        <div className="card">
          <EmptyState icon={SearchX} title={`No departments match “${query}”`} description="Try a name, code or keyword.">
            <button type="button" className="btn btn-secondary" onClick={() => setQuery("")}>
              Clear search
            </button>
          </EmptyState>
        </div>
      ) : (
        <div className="dept-grid">
          {visible.map((d, i) => {
            const members = membersByDept.get(d.id) ?? [];
            const count = d.studentCount || 0;
            const share = students.length ? (count / students.length) * 100 : 0;
            const color = deptColor(d.id);
            return (
              <article className="dept-card" key={d.id} style={{ "--i": i, "--c": color }}>
                <button
                  type="button"
                  className="dept-card-hit"
                  onClick={() => openDept(d.id)}
                  aria-label={`Open ${d.name}`}
                />
                <div className="dept-card-head">
                  <span className="dept-tile">{d.code}</span>
                  <Menu
                    label={`Actions for ${d.name}`}
                    trigger={(props) => (
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={`Actions for ${d.name}`} {...props}>
                        <Ellipsis aria-hidden="true" />
                      </button>
                    )}
                  >
                    <MenuItem icon={Eye} onSelect={() => openDept(d.id)}>
                      View details
                    </MenuItem>
                    <MenuItem
                      icon={Users}
                      onSelect={() => navigate(`/dashboard/students?dept=${d.id}`, { viewTransition: true })}
                    >
                      Open in directory
                    </MenuItem>
                    {isAdmin && (
                      <>
                        <MenuItem icon={Pencil} onSelect={() => openDept(d.id, true)}>
                          Edit
                        </MenuItem>
                        <MenuSeparator />
                        <MenuItem icon={Trash} tone="danger" onSelect={() => setConfirm({ open: true, dept: d })}>
                          Delete
                        </MenuItem>
                      </>
                    )}
                  </Menu>
                </div>

                <div>
                  <h2 className="dept-card-name">{d.name}</h2>
                  <p className="dept-card-desc">{d.description || "No description yet."}</p>
                </div>

                <div className="dept-card-foot">
                  <div className="dept-card-stats">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {members.length > 0 && <AvatarStack people={members} max={3} />}
                      <span>
                        <strong>{count}</strong> {count === 1 ? "student" : "students"}
                      </span>
                    </span>
                    <span className="tnum">{Math.round(share)}% of accounts</span>
                  </div>
                  <div
                    className="meter"
                    style={{ background: "color-mix(in oklab, var(--c) 16%, transparent)" }}
                    role="meter"
                    aria-label={`${d.code} share of all accounts`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(share)}
                  >
                    <span style={{ width: `${share}%`, background: "var(--c)" }} />
                  </div>
                </div>
              </article>
            );
          })}

          {isAdmin && !query && (
            <button type="button" className="dept-card dept-card-new" onClick={startCreate} style={{ "--i": visible.length }}>
              <span className="empty-icon">
                <Plus aria-hidden="true" />
              </span>
              New department
            </button>
          )}
        </div>
      )}

      <DepartmentSheet
        open={sheetOpen}
        mode={sheetMode}
        dept={sheetDept}
        onClose={closeSheet}
        onEdit={() => setEditing(true)}
        onCancelEdit={() => setEditing(false)}
        onDelete={(d) => setConfirm({ open: true, dept: d })}
        onSaved={(saved) => {
          setEditing(false);
          if (saved?.id) setParam({ open: saved.id, new: null });
          else closeSheet();
        }}
      />

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
        onConfirm={runDelete}
        title={`Delete ${confirm.dept?.name ?? "department"}?`}
        description={deleteCopy(confirm.dept)}
        confirmLabel="Delete department"
        requireText={confirm.dept?.studentCount ? confirm.dept.code : undefined}
      />
    </div>
  );
}
