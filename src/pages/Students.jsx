import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowRightLeft,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Ellipsis,
  Eye,
  GraduationCap,
  Pencil,
  RefreshCw,
  Search,
  SearchX,
  ServerCrash,
  ShieldCheck,
  Trash,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "../components/Menu";
import { StudentSheet } from "../components/StudentSheet";
import { Avatar, DeptChip, EmptyState, Kbd, RoleBadge, Segmented, Select } from "../components/ui";
import { API_DOWN_HINT } from "../api";
import { useData, useToast } from "../lib/contexts";
import { copyText } from "../lib/dom";
import { useHotkeys } from "../lib/hotkeys";
import { compareText, downloadCsv, errorMessage, pluralize, studentCode } from "../lib/format";

const PAGE_SIZE = 25;

const SORTERS = {
  name: (s) => s.name ?? "",
  id: (s) => s.id,
  department: (s) => s.departmentCode ?? "￿",
  role: (s) => s.role ?? "",
};

function SortHeader({ label, column, sort, onSort }) {
  const active = sort.key === column;
  const Icon = !active ? ArrowDownUp : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button type="button" className="th-sort" data-active={active} onClick={() => onSort(column)}>
      {label}
      <Icon aria-hidden="true" />
    </button>
  );
}

function SkeletonTable({ admin }) {
  return Array.from({ length: 8 }, (_, i) => (
    <tr key={i} aria-hidden="true">
      {admin && (
        <td className="col-check">
          <span className="skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} />
        </td>
      )}
      <td>
        <div className="cell-person">
          <span className="skeleton" style={{ width: 28, height: 28, borderRadius: "50%" }} />
          <span style={{ display: "grid", gap: 6 }}>
            <span className="skeleton" style={{ width: 120 + ((i * 37) % 60) }} />
            <span className="skeleton" style={{ width: 160, height: 10 }} />
          </span>
        </div>
      </td>
      <td className="col-hide-sm">
        <span className="skeleton" style={{ width: 70 }} />
      </td>
      <td>
        <span className="skeleton" style={{ width: 110, height: 20 }} />
      </td>
      <td className="col-hide-md">
        <span className="skeleton" style={{ width: 70, height: 20, borderRadius: 999 }} />
      </td>
      <td />
    </tr>
  ));
}

export default function Students() {
  const { toast } = useToast();
  const {
    students,
    departments,
    status,
    refresh,
    isAdmin,
    me,
    deptColor,
    deptById,
    deleteStudent,
    deleteStudents,
    moveStudents,
  } = useData();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, targets: [] });
  const searchRef = useRef(null);
  const headerCheckRef = useRef(null);

  const query = params.get("q") ?? "";
  const dept = params.get("dept") ?? "all";
  const role = params.get("role") ?? "all";
  const sheetId = params.get("student");
  const creating = params.get("new") === "1" && isAdmin;

  const setParam = (patch, { push = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === "" || v === "all") next.delete(k);
      else next.set(k, String(v));
    });
    setParams(next, { replace: !push });
  };

  const setFilter = (patch) => {
    setParam(patch);
    setPage(0);
  };

  const openStudent = (id) => {
    setEditing(false);
    setParam({ student: id, new: null }, { push: true });
  };

  const closeSheet = () => {
    setEditing(false);
    setParam({ student: null, new: null });
  };

  useHotkeys({
    "/": () => searchRef.current?.focus(),
    c: () => isAdmin && setParam({ new: 1, student: null }, { push: true }),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = students.filter((s) => {
      if (dept === "none" && s.departmentId) return false;
      if (dept !== "all" && dept !== "none" && String(s.departmentId) !== dept) return false;
      if (role !== "all" && s.role !== role) return false;
      if (!q) return true;
      return [s.name, s.email, studentCode(s.id), s.departmentCode, s.departmentName].some((f) =>
        String(f ?? "").toLowerCase().includes(q)
      );
    });
    const getter = SORTERS[sort.key];
    const dir = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      return (typeof va === "number" ? va - vb : compareText(va, vb)) * dir;
    });
  }, [students, query, dept, role, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  // Drop selections that no longer exist (deleted elsewhere)
  const selectedStudents = students.filter((s) => selected.has(s.id));
  const pageIds = rows.map((r) => r.id);
  const pageSelected = pageIds.filter((id) => selected.has(id)).length;

  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = pageSelected > 0 && pageSelected < pageIds.length;
    }
  }, [pageSelected, pageIds.length]);

  const sheetStudent = sheetId ? students.find((s) => String(s.id) === sheetId) : null;
  const sheetOpen = creating || !!sheetId;
  const sheetMode = creating ? "create" : editing && isAdmin ? "edit" : "view";

  useEffect(() => {
    if (status === "ready" && sheetId && !students.some((s) => String(s.id) === sheetId)) {
      toast({ tone: "error", title: "Student not found", description: `No record with ID ${sheetId}.` });
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          next.delete("student");
          return next;
        },
        { replace: true }
      );
    }
  }, [status, sheetId, students, toast, setParams]);

  const onSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageSelected === pageIds.length) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const askDelete = (targets) => {
    const safe = targets.filter((s) => s.id !== me?.id);
    if (!safe.length) {
      toast({ tone: "warning", title: "You can't delete your own account", description: "Ask another administrator." });
      return;
    }
    setConfirm({ open: true, targets: safe, skippedSelf: safe.length !== targets.length });
  };

  const runDelete = async () => {
    const targets = confirm.targets;
    // Close the sheet first so the refreshed list doesn't report its record as missing
    if (targets.some((t) => String(t.id) === sheetId)) closeSheet();
    try {
      if (targets.length === 1) {
        await deleteStudent(targets[0].id);
        toast({ title: "Student deleted", description: `${targets[0].name} no longer has access.` });
      } else {
        const results = await deleteStudents(targets.map((t) => t.id));
        const failed = results.filter((r) => r.status === "rejected").length;
        toast(
          failed
            ? { tone: "warning", title: `${targets.length - failed} deleted, ${failed} failed`, description: "Refresh and try the rest again." }
            : { title: `${pluralize(targets.length, "student")} deleted` }
        );
      }
      setSelected((prev) => {
        const next = new Set(prev);
        targets.forEach((t) => next.delete(t.id));
        return next;
      });
    } catch (err) {
      toast({ tone: "error", title: "Delete failed", description: errorMessage(err) });
      throw err;
    }
  };

  const moveSelected = async (target) => {
    const list = selectedStudents;
    try {
      const results = await moveStudents(list, target.id);
      const failed = results.filter((r) => r.status === "rejected").length;
      toast(
        failed
          ? { tone: "warning", title: `Moved ${list.length - failed}, ${failed} failed` }
          : { title: `Moved ${pluralize(list.length, "student")}`, description: `Now in ${target.name}.` }
      );
      setSelected(new Set());
    } catch (err) {
      toast({ tone: "error", title: "Move failed", description: errorMessage(err) });
    }
  };

  const exportCsv = () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `edutrack-students-${date}.csv`,
      ["Enrollment ID", "Name", "Email", "Role", "Department code", "Department"],
      filtered.map((s) => [studentCode(s.id), s.name, s.email, s.role, s.departmentCode ?? "", s.departmentName ?? ""])
    );
    toast({ title: "Export ready", description: `${pluralize(filtered.length, "student")} saved as CSV.` });
  };

  const activeDept = dept !== "all" && dept !== "none" ? deptById.get(Number(dept)) : null;
  const hasFilters = !!query || dept !== "all" || role !== "all";
  const loading = status === "loading";
  const counts = {
    all: students.length,
    STUDENT: students.filter((s) => s.role === "STUDENT").length,
    ADMIN: students.filter((s) => s.role === "ADMIN").length,
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            Students {!loading && <span className="badge badge-count">{students.length}</span>}
          </h1>
          <p className="page-desc">Every account enrolled on the platform, with department and access level.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={!filtered.length}>
            <Download aria-hidden="true" /> Export
          </button>
          {isAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setParam({ new: 1, student: null }, { push: true })}
            >
              <UserPlus aria-hidden="true" /> Enroll student <Kbd>C</Kbd>
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
            placeholder="Search name, email or ID"
            value={query}
            onChange={(e) => setFilter({ q: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                e.preventDefault();
                setFilter({ q: null });
              }
            }}
            aria-label="Search students"
          />
          <span className="input-trail">{!query && <Kbd>/</Kbd>}</span>
        </span>
        <Select value={dept} onChange={(e) => setFilter({ dept: e.target.value })} aria-label="Filter by department">
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.code} — {d.name}
            </option>
          ))}
          <option value="none">Unassigned</option>
        </Select>
        <Segmented
          label="Filter by role"
          value={role}
          onChange={(v) => setFilter({ role: v })}
          options={[
            { value: "all", label: "All" },
            { value: "STUDENT", label: "Students", icon: GraduationCap },
            { value: "ADMIN", label: "Admins", icon: ShieldCheck },
          ]}
        />
        <span className="toolbar-spacer" />
        {!loading && (
          <span className="result-count" aria-live="polite">
            {hasFilters ? `${filtered.length} of ${students.length}` : pluralize(students.length, "record")}
          </span>
        )}
      </div>

      {hasFilters && (
        <div className="filter-chips">
          {query && (
            <span className="filter-chip">
              “{query}”
              <button type="button" onClick={() => setFilter({ q: null })} aria-label="Clear search">
                <X aria-hidden="true" />
              </button>
            </span>
          )}
          {dept !== "all" && (
            <span className="filter-chip">
              {dept === "none" ? "Unassigned" : activeDept ? `${activeDept.code} · ${activeDept.name}` : "Department"}
              <button type="button" onClick={() => setFilter({ dept: null })} aria-label="Clear department filter">
                <X aria-hidden="true" />
              </button>
            </span>
          )}
          {role !== "all" && (
            <span className="filter-chip">
              {role === "ADMIN" ? "Admins" : "Students"} · {counts[role]}
              <button type="button" onClick={() => setFilter({ role: null })} aria-label="Clear role filter">
                <X aria-hidden="true" />
              </button>
            </span>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFilter({ q: null, dept: null, role: null })}>
            Clear all
          </button>
        </div>
      )}

      <section className="card table-card" aria-label="Student directory">
        {status === "error" ? (
          <EmptyState
            icon={ServerCrash}
            title="Can't load students"
            description={API_DOWN_HINT}
          >
            <button type="button" className="btn btn-primary" onClick={refresh}>
              <RefreshCw aria-hidden="true" /> Retry
            </button>
          </EmptyState>
        ) : !loading && students.length === 0 ? (
          <EmptyState icon={Users} title="No students yet" description="Enrolled students will appear in this directory.">
            {isAdmin && (
              <button type="button" className="btn btn-primary" onClick={() => setParam({ new: 1 }, { push: true })}>
                <UserPlus aria-hidden="true" /> Enroll the first student
              </button>
            )}
          </EmptyState>
        ) : !loading && filtered.length === 0 ? (
          <EmptyState icon={SearchX} title="No matching students" description="Try a different search, or clear the filters to see everyone.">
            <button type="button" className="btn btn-secondary" onClick={() => setFilter({ q: null, dept: null, role: null })}>
              Clear filters
            </button>
          </EmptyState>
        ) : (
          <>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    {isAdmin && (
                      <th className="col-check">
                        <input
                          ref={headerCheckRef}
                          type="checkbox"
                          className="checkbox"
                          checked={pageIds.length > 0 && pageSelected === pageIds.length}
                          onChange={togglePage}
                          aria-label="Select all students on this page"
                          disabled={loading}
                        />
                      </th>
                    )}
                    <th scope="col">
                      <SortHeader label="Student" column="name" sort={sort} onSort={onSort} />
                    </th>
                    <th scope="col" className="col-hide-sm">
                      <SortHeader label="ID" column="id" sort={sort} onSort={onSort} />
                    </th>
                    <th scope="col">
                      <SortHeader
                        label={
                          <>
                            <span className="label-long">Department</span>
                            <span className="label-short">Dept</span>
                          </>
                        }
                        column="department"
                        sort={sort}
                        onSort={onSort}
                      />
                    </th>
                    <th scope="col" className="col-hide-md">
                      <SortHeader label="Access" column="role" sort={sort} onSort={onSort} />
                    </th>
                    <th scope="col" className="col-actions">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonTable admin={isAdmin} />
                  ) : (
                    rows.map((s) => {
                      const isSelected = selected.has(s.id);
                      const isMe = me?.id === s.id;
                      return (
                        <tr
                          key={s.id}
                          tabIndex={0}
                          aria-selected={isAdmin ? isSelected : undefined}
                          onClick={() => openStudent(s.id)}
                          onKeyDown={(e) => {
                            if (e.target !== e.currentTarget) return;
                            if (e.key === "Enter") openStudent(s.id);
                            if (e.key === " " && isAdmin) {
                              e.preventDefault();
                              toggleRow(s.id);
                            }
                          }}
                        >
                          {isAdmin && (
                            <td className="col-check" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="checkbox"
                                checked={isSelected}
                                onChange={() => toggleRow(s.id)}
                                aria-label={`Select ${s.name}`}
                              />
                            </td>
                          )}
                          <td>
                            <div className="cell-person">
                              <Avatar name={s.name} seed={s.email} />
                              <span className="cell-person-text">
                                <span className="cell-person-name">
                                  <span className="truncate">{s.name}</span>
                                  {isMe && <span className="you-tag">You</span>}
                                </span>
                                <span className="cell-person-sub truncate">{s.email}</span>
                              </span>
                            </div>
                          </td>
                          <td className="col-hide-sm">
                            <span className="mono cell-id">{studentCode(s.id)}</span>
                          </td>
                          <td>
                            <DeptChip code={s.departmentCode} name={s.departmentName} color={deptColor(s.departmentId)} />
                          </td>
                          <td className="col-hide-md">
                            <RoleBadge role={s.role} />
                          </td>
                          <td className="col-actions">
                            <Menu
                              label={`Actions for ${s.name}`}
                              trigger={(props) => (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon btn-sm row-menu-btn"
                                  aria-label={`Actions for ${s.name}`}
                                  {...props}
                                >
                                  <Ellipsis aria-hidden="true" />
                                </button>
                              )}
                            >
                              <MenuItem icon={Eye} onSelect={() => openStudent(s.id)}>
                                View profile
                              </MenuItem>
                              {isAdmin && (
                                <MenuItem
                                  icon={Pencil}
                                  onSelect={() => {
                                    setParam({ student: s.id, new: null }, { push: true });
                                    setEditing(true);
                                  }}
                                >
                                  Edit
                                </MenuItem>
                              )}
                              <MenuItem
                                icon={Copy}
                                onSelect={async () =>
                                  (await copyText(s.email)) && toast({ tone: "info", title: "Email copied", description: s.email })
                                }
                              >
                                Copy email
                              </MenuItem>
                              {isAdmin && (
                                <>
                                  <MenuSeparator />
                                  <MenuItem icon={Trash} tone="danger" disabled={isMe} onSelect={() => askDelete([s])}>
                                    Delete
                                  </MenuItem>
                                </>
                              )}
                            </Menu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!loading && (
              <div className="table-footer">
                <span>
                  {isAdmin && selected.size > 0
                    ? `${selected.size} selected`
                    : `Showing ${current * PAGE_SIZE + 1}–${current * PAGE_SIZE + rows.length} of ${filtered.length}`}
                </span>
                {pageCount > 1 && (
                  <div className="pager">
                    <span className="pager-label">
                      Page {current + 1} of {pageCount}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon btn-sm"
                      onClick={() => setPage(current - 1)}
                      disabled={current === 0}
                      aria-label="Previous page"
                    >
                      <ChevronLeft aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon btn-sm"
                      onClick={() => setPage(current + 1)}
                      disabled={current >= pageCount - 1}
                      aria-label="Next page"
                    >
                      <ChevronRight aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {isAdmin && selectedStudents.length > 0 && (
        <div className="bulk-bar" role="toolbar" aria-label="Bulk actions">
          <span className="bulk-count">{selectedStudents.length} selected</span>
          <span className="bulk-sep" />
          <Menu
            label="Move to department"
            align="start"
            trigger={(props) => (
              <button type="button" className="btn btn-ghost btn-sm" {...props}>
                <ArrowRightLeft aria-hidden="true" /> Move to…
              </button>
            )}
          >
            <MenuLabel>Move {pluralize(selectedStudents.length, "student")} to</MenuLabel>
            {departments.map((d) => (
              <MenuItem key={d.id} meta={d.code} onSelect={() => moveSelected(d)}>
                {d.name}
              </MenuItem>
            ))}
          </Menu>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => askDelete(selectedStudents)}>
            <Trash aria-hidden="true" /> Delete
          </button>
          <span className="bulk-sep" />
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setSelected(new Set())}
            aria-label="Clear selection"
          >
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      <StudentSheet
        open={sheetOpen}
        mode={sheetMode}
        student={sheetStudent}
        onClose={closeSheet}
        onEdit={() => setEditing(true)}
        onCancelEdit={() => setEditing(false)}
        onDelete={(s) => askDelete([s])}
        onOpenStudent={(id) => {
          setEditing(false);
          setParam({ student: id });
        }}
        onSaved={(saved) => {
          setEditing(false);
          if (saved?.id) setParam({ student: saved.id, new: null });
          else closeSheet();
        }}
      />

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
        onConfirm={runDelete}
        title={
          confirm.targets.length === 1 ? `Delete ${confirm.targets[0].name}?` : `Delete ${confirm.targets.length} students?`
        }
        description={
          confirm.targets.length === 1
            ? "This permanently removes the account and its access to EduTrack. This can't be undone."
            : "These accounts and their access will be permanently removed. This can't be undone."
        }
        confirmLabel={confirm.targets.length === 1 ? "Delete student" : `Delete ${confirm.targets.length} students`}
      >
        {confirm.targets.length > 1 && (
          <div className="roster">
            {confirm.targets.slice(0, 4).map((t) => (
              <div className="list-row" key={t.id}>
                <Avatar name={t.name} seed={t.email} size="sm" />
                <span className="list-main">
                  <span className="list-title truncate">{t.name}</span>
                </span>
                <span className="list-aside mono subtle" style={{ fontSize: 12 }}>
                  {studentCode(t.id)}
                </span>
              </div>
            ))}
            {confirm.targets.length > 4 && (
              <div className="list-row subtle" style={{ fontSize: 12.5 }}>
                and {confirm.targets.length - 4} more
              </div>
            )}
          </div>
        )}
        {confirm.skippedSelf && (
          <p className="field-hint" style={{ marginTop: 10 }}>
            Your own account was left out of the selection.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
