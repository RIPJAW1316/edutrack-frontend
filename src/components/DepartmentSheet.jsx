import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CircleAlert, Eye, Landmark, Pencil, Trash, Users, X } from "lucide-react";
import { Dialog } from "./Dialog";
import { Avatar, Field, RoleBadge, Spinner } from "./ui";
import { useData, useToast } from "../lib/contexts";
import { errorMessage, percent, studentCode } from "../lib/format";

const MAX_TEXT = 255; // JPA default column length

function DepartmentView({ dept, onEdit, onDelete }) {
  const navigate = useNavigate();
  const { students, deptColor, isAdmin } = useData();
  const members = students
    .filter((s) => s.departmentId === dept.id)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const admins = members.filter((m) => m.role === "ADMIN").length;
  const openStudent = (id) => navigate(`/dashboard/students?student=${id}`, { viewTransition: true });

  return (
    <>
      <div className="sheet-body">
        <div className="profile-head">
          <span className="dept-tile dept-tile-lg" style={{ "--c": deptColor(dept.id) }}>
            {dept.code}
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 className="profile-name" id="dept-sheet-title">
              {dept.name}
            </h2>
            <p className="profile-sub">
              Department code <span className="mono">{dept.code}</span>
            </p>
          </div>
        </div>

        <section className="section">
          <div className="stat-row">
            <div className="stat-mini">
              <p className="stat-mini-label">Enrolled</p>
              <p className="stat-mini-value">{members.length}</p>
            </div>
            <div className="stat-mini">
              <p className="stat-mini-label">Share of accounts</p>
              <p className="stat-mini-value">{percent(members.length, students.length)}</p>
            </div>
            <div className="stat-mini">
              <p className="stat-mini-label">Administrators</p>
              <p className="stat-mini-value">{admins}</p>
            </div>
          </div>
        </section>

        <section className="section">
          <h3 className="section-title">About</h3>
          <p className={dept.description ? "" : "subtle"} style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            {dept.description || "No description has been added for this department."}
          </p>
        </section>

        <section className="section">
          <h3 className="section-title">
            Members
            <span className="badge badge-count">{members.length}</span>
          </h3>
          <div className="roster">
            {members.length === 0 ? (
              <p className="roster-empty">No students are enrolled in this department yet.</p>
            ) : (
              members.map((m) => (
                <button type="button" key={m.id} className="list-row" onClick={() => openStudent(m.id)}>
                  <Avatar name={m.name} seed={m.email} size="sm" />
                  <span className="list-main">
                    <span className="list-title truncate">{m.name}</span>
                    <span className="list-sub truncate">{m.email}</span>
                  </span>
                  <span className="list-aside">
                    {m.role === "ADMIN" && <RoleBadge role="ADMIN" />}
                    <span className="mono subtle col-hide-sm" style={{ fontSize: 12 }}>
                      {studentCode(m.id)}
                    </span>
                    <ChevronRight width={14} height={14} className="subtle" aria-hidden="true" />
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="sheet-footer">
        {isAdmin && (
          <button type="button" className="btn btn-danger-ghost" onClick={onDelete}>
            <Trash aria-hidden="true" /> Delete
          </button>
        )}
        <span className="spacer" />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate(`/dashboard/students?dept=${dept.id}`, { viewTransition: true })}
        >
          <Users aria-hidden="true" /> Open in directory
        </button>
        {isAdmin ? (
          <button type="button" className="btn btn-primary" onClick={onEdit} data-autofocus>
            <Pencil aria-hidden="true" /> Edit
          </button>
        ) : (
          <span className="subtle" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
            <Eye width={14} height={14} aria-hidden="true" /> Read-only
          </span>
        )}
      </div>
    </>
  );
}

function DepartmentForm({ mode, dept, onCancel, onSaved }) {
  const { departments, createDepartment, updateDepartment } = useData();
  const { toast } = useToast();
  const creating = mode === "create";
  const [form, setForm] = useState(() => ({
    name: dept?.name ?? "",
    code: dept?.code ?? "",
    description: dept?.description ?? "",
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const input = document.getElementById("dept-name");
    if (input?.closest("dialog[open]")) input.focus({ preventScroll: true });
  }, []);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const validate = () => {
    const found = {};
    const code = form.code.trim().toUpperCase();
    if (!form.name.trim()) found.name = "Department name is required.";
    if (!code) found.code = "A short code is required, e.g. CSE.";
    else if (!/^[A-Z0-9&-]{2,10}$/.test(code)) found.code = "Use 2–10 letters, numbers, & or -.";
    else if (departments.some((d) => d.code?.toUpperCase() === code && d.id !== dept?.id))
      found.code = `${code} is already used by another department.`;
    return found;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) {
      document.getElementById(`dept-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
    };
    setSubmitting(true);
    try {
      const saved = creating ? await createDepartment(payload) : await updateDepartment(dept.id, payload);
      toast(
        creating
          ? { title: "Department created", description: `${payload.code} · ${payload.name} is ready for enrollments.` }
          : { title: "Department updated", description: `${payload.name} has been saved.` }
      );
      onSaved(saved);
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      else setFormError(errorMessage(err, "We couldn't save this department. Please try again."));
      setSubmitting(false);
    }
  };

  return (
    <form className="sheet-form" onSubmit={onSubmit} noValidate>
      <div className="sheet-body">
        <h2 className="sheet-form-title" id="dept-sheet-title">
          {creating ? "Create a department" : `Edit ${dept?.name}`}
        </h2>
        <p className="sheet-form-desc">
          {creating
            ? "Departments group students and power the directory filters."
            : "Changes apply everywhere this department appears."}
        </p>

        {formError && (
          <div className="callout callout-danger" role="alert" style={{ marginBottom: 18 }}>
            <CircleAlert aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <div className="form-stack">
          <Field label="Department name" htmlFor="dept-name" error={errors.name}>
            <input
              id="dept-name"
              className="input"
              value={form.name}
              maxLength={MAX_TEXT}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Artificial Intelligence & Data Science"
              autoComplete="off"
              aria-invalid={!!errors.name}
              data-autofocus
            />
          </Field>

          <Field label="Code" htmlFor="dept-code" error={errors.code} hint="Short identifier shown on chips and filters.">
            <input
              id="dept-code"
              className="input code-input"
              value={form.code}
              maxLength={10}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="AIDS"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!errors.code}
              style={{ maxWidth: 180 }}
            />
          </Field>

          <Field
            label="Description"
            optional
            htmlFor="dept-description"
            error={errors.description}
            aside={
              <span className="char-count">
                {form.description.length}/{MAX_TEXT}
              </span>
            }
          >
            <textarea
              id="dept-description"
              className="textarea"
              rows={4}
              maxLength={MAX_TEXT}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Curriculum focus, specialisations and degree programmes…"
            />
          </Field>
        </div>
      </div>

      <div className="sheet-footer">
        <span className="spacer" />
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting && <Spinner />}
          {creating ? "Create department" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export function DepartmentSheet({ open, mode, dept, onClose, onEdit, onCancelEdit, onDelete, onSaved }) {
  const [shown, setShown] = useState({ dept, mode, session: 0 });
  if (open && (dept !== shown.dept || mode !== shown.mode)) {
    setShown((prev) => ({ dept, mode, session: prev.session + (prev.mode === mode ? 0 : 1) }));
  }
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setShown((prev) => ({ ...prev, session: prev.session + 1 }));
  }

  const d = open ? dept : shown.dept;
  const m = open ? mode : shown.mode;

  return (
    <Dialog open={open} onClose={onClose} variant="sheet" labelledBy="dept-sheet-title">
      <div className="sheet">
        <div className="sheet-topbar">
          <span className="sheet-crumb">
            <Landmark aria-hidden="true" /> Departments <ChevronRight aria-hidden="true" />
            <strong className="truncate">{m === "create" ? "New department" : d?.code ?? "—"}</strong>
          </span>
          <span className="sheet-topbar-actions">
            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close panel">
              <X aria-hidden="true" />
            </button>
          </span>
        </div>

        {m !== "create" && !d ? (
          <div className="sheet-body">
            <p className="muted" id="dept-sheet-title">
              This department no longer exists.
            </p>
          </div>
        ) : m === "view" ? (
          <DepartmentView dept={d} onEdit={onEdit} onDelete={() => onDelete(d)} />
        ) : (
          <DepartmentForm
            key={`${m}-${d?.id ?? "new"}-${shown.session}`}
            mode={m}
            dept={d}
            onCancel={m === "edit" ? onCancelEdit : onClose}
            onSaved={onSaved}
          />
        )}
      </div>
    </Dialog>
  );
}

