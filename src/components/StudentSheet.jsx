import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  GraduationCap,
  Pencil,
  ShieldCheck,
  Trash,
  TriangleAlert,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { Dialog } from "./Dialog";
import { Avatar, CopyButton, DeptChip, Field, RoleBadge, Segmented, Select, Spinner } from "./ui";
import { useData, useToast } from "../lib/contexts";
import { errorMessage, generatePassword, pluralize, studentCode } from "../lib/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StudentView({ student, onEdit, onDelete, onOpenStudent }) {
  const { students, deptById, deptColor, isAdmin, me } = useData();
  const dept = student.departmentId ? deptById.get(student.departmentId) : null;
  const peers = dept ? students.filter((s) => s.departmentId === dept.id && s.id !== student.id) : [];
  const isMe = me?.id === student.id;

  return (
    <>
      <div className="sheet-body">
        <div className="profile-head">
          <Avatar name={student.name} seed={student.email} size="xl" />
          <div style={{ minWidth: 0 }}>
            <h2 className="profile-name" id="student-sheet-title">
              {student.name} {isMe && <span className="you-tag">You</span>}
            </h2>
            <p className="profile-sub">
              <span className="truncate">{student.email}</span>
              <CopyButton value={student.email} label="Copy email" />
            </p>
            <div className="profile-badges">
              <RoleBadge role={student.role} />
              <DeptChip code={student.departmentCode} name={student.departmentName} color={deptColor(student.departmentId)} />
            </div>
          </div>
        </div>

        <section className="section">
          <h3 className="section-title">Details</h3>
          <dl className="props">
            <dt>Enrollment ID</dt>
            <dd>
              <span className="mono">{studentCode(student.id)}</span>
              <CopyButton value={studentCode(student.id)} label="Copy ID" />
            </dd>
            <dt>Email</dt>
            <dd>
              <a className="truncate" href={`mailto:${student.email}`}>
                {student.email}
              </a>
            </dd>
            <dt>Access level</dt>
            <dd>
              <span>{student.role === "ADMIN" ? "Administrator — full access" : "Student — read-only"}</span>
            </dd>
            <dt>Department</dt>
            <dd>
              <span className="truncate">{student.departmentName || "Unassigned"}</span>
            </dd>
          </dl>
        </section>

        {dept && (
          <section className="section">
            <h3 className="section-title">
              Department
              <Link to={`/dashboard/departments?open=${dept.id}`} viewTransition className="card-link">
                Open <ArrowUpRight aria-hidden="true" />
              </Link>
            </h3>
            <div className="info-card">
              <div className="info-card-head">
                <span className="dept-tile" style={{ "--c": deptColor(dept.id) }}>
                  {dept.code}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p className="list-title">{dept.name}</p>
                  <p className="list-sub">{pluralize(dept.studentCount || 0, "member")}</p>
                </div>
              </div>
              {dept.description && <p>{dept.description}</p>}
            </div>
          </section>
        )}

        {peers.length > 0 && (
          <section className="section">
            <h3 className="section-title">
              Also in {dept.code}
              <span className="badge badge-count">{peers.length}</span>
            </h3>
            <div className="roster">
              {peers.slice(0, 6).map((p) => (
                <button type="button" key={p.id} className="list-row" onClick={() => onOpenStudent(p.id)}>
                  <Avatar name={p.name} seed={p.email} size="sm" />
                  <span className="list-main">
                    <span className="list-title truncate">{p.name}</span>
                  </span>
                  <span className="list-aside">
                    <span className="mono subtle" style={{ fontSize: 12 }}>
                      {studentCode(p.id)}
                    </span>
                    <ChevronRight width={14} height={14} className="subtle" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="sheet-footer">
        {isAdmin ? (
          <>
            <button
              type="button"
              className="btn btn-danger-ghost"
              onClick={onDelete}
              disabled={isMe}
              title={isMe ? "You can't delete your own account while signed in" : undefined}
            >
              <Trash aria-hidden="true" /> Delete
            </button>
            <span className="spacer" />
            <button type="button" className="btn btn-primary" onClick={onEdit} data-autofocus>
              <Pencil aria-hidden="true" /> Edit student
            </button>
          </>
        ) : (
          <span className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
            <Eye width={14} height={14} aria-hidden="true" /> You have read-only access
          </span>
        )}
      </div>
    </>
  );
}

function StudentForm({ mode, student, onCancel, onSaved }) {
  const { students, departments, me, createStudent, updateStudent } = useData();
  const { toast } = useToast();
  const creating = mode === "create";
  const [form, setForm] = useState(() => ({
    name: student?.name ?? "",
    email: student?.email ?? "",
    password: "",
    role: student?.role ?? "STUDENT",
    departmentId: student?.departmentId ? String(student.departmentId) : "",
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isMe = !creating && me?.id === student?.id;
  const lockedDept = !creating && !!student?.departmentId;

  // Switching from view → edit happens inside an open dialog, so focus manually
  useEffect(() => {
    const input = document.getElementById("stu-name");
    if (input?.closest("dialog[open]")) input.focus({ preventScroll: true });
  }, []);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const validate = () => {
    const found = {};
    const email = form.email.trim().toLowerCase();
    if (!form.name.trim()) found.name = "Name is required.";
    if (!EMAIL_RE.test(email)) found.email = "Enter a valid email address.";
    else if (students.some((s) => s.email?.toLowerCase() === email && s.id !== student?.id))
      found.email = "Another account already uses this email.";
    if (creating && form.password.length < 8) found.password = "Set an initial password of at least 8 characters.";
    if (!creating && form.password && form.password.length < 8) found.password = "Use at least 8 characters.";
    return found;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) {
      document.getElementById(`stu-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      departmentId: form.departmentId ? Number(form.departmentId) : null,
    };
    if (form.password) payload.password = form.password;

    setSubmitting(true);
    try {
      const saved = creating ? await createStudent(payload) : await updateStudent(student.id, payload);
      toast(
        creating
          ? { title: "Student enrolled", description: `${payload.name} can now sign in with the initial password.` }
          : { title: "Changes saved", description: `${payload.name}'s record is up to date.` }
      );
      onSaved(saved);
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      else setFormError(errorMessage(err, "We couldn't save this student. Please try again."));
      setSubmitting(false);
    }
  };

  return (
    <form className="sheet-form" onSubmit={onSubmit} noValidate>
      <div className="sheet-body">
        <h2 className="sheet-form-title" id="student-sheet-title">
          {creating ? "Enroll a new student" : `Edit ${student?.name}`}
        </h2>
        <p className="sheet-form-desc">
          {creating
            ? "Create an account and set the credentials they'll use to sign in."
            : "Update profile details, access level or department."}
        </p>

        {formError && (
          <div className="callout callout-danger" role="alert" style={{ marginBottom: 18 }}>
            <CircleAlert aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <div className="form-stack">
          <Field label="Full name" htmlFor="stu-name" error={errors.name}>
            <input
              id="stu-name"
              className="input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Priya Sharma"
              autoComplete="off"
              aria-invalid={!!errors.name}
              data-autofocus
            />
          </Field>

          <Field label="Email" htmlFor="stu-email" error={errors.email}>
            <input
              id="stu-email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@university.edu"
              autoComplete="off"
              aria-invalid={!!errors.email}
            />
          </Field>

          <Field
            label={creating ? "Initial password" : "Reset password"}
            optional={!creating}
            htmlFor="stu-password"
            error={errors.password}
            hint={creating ? "Share it securely — they can't recover it from EduTrack." : "Leave blank to keep the current password."}
            aside={
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ height: 22, padding: "0 6px", marginRight: -6 }}
                onClick={() => {
                  set("password", generatePassword());
                  setShowPassword(true);
                }}
              >
                <WandSparkles aria-hidden="true" /> Generate
              </button>
            }
          >
            <span className="input-wrap">
              <input
                id="stu-password"
                type={showPassword ? "text" : "password"}
                className="input"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder={creating ? "At least 8 characters" : "••••••••"}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
              />
              <span className="input-trail">
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
                {form.password && <CopyButton value={form.password} label="Copy password" />}
              </span>
            </span>
          </Field>

          <Field label="Access level">
            <Segmented
              label="Access level"
              block
              value={form.role}
              onChange={(v) => set("role", v)}
              options={[
                { value: "STUDENT", label: "Student", icon: GraduationCap },
                { value: "ADMIN", label: "Administrator", icon: ShieldCheck },
              ]}
            />
          </Field>

          {isMe && form.role !== "ADMIN" && (
            <div className="callout callout-warning" role="status">
              <TriangleAlert aria-hidden="true" />
              <span>
                <strong>You&apos;re changing your own role.</strong> You&apos;ll lose administrator access after
                saving.
              </span>
            </div>
          )}

          <Field
            label="Department"
            htmlFor="stu-dept"
            hint={lockedDept ? "Students can move between departments but can't be unassigned once placed." : undefined}
          >
            <Select id="stu-dept" value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
              {!lockedDept && <option value="">No department</option>}
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </Select>
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
          {creating ? "Enroll student" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

/**
 * Right-hand sheet for viewing, editing and creating students.
 * mode: "view" | "edit" | "create"
 */
export function StudentSheet({ open, mode, student, onClose, onEdit, onCancelEdit, onDelete, onSaved, onOpenStudent }) {
  // Keep the last content while the exit transition plays
  const [shown, setShown] = useState({ student, mode, session: 0 });
  if (open && (student !== shown.student || mode !== shown.mode)) {
    setShown((prev) => ({ student, mode, session: prev.session + (prev.mode === mode ? 0 : 1) }));
  }
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setShown((prev) => ({ ...prev, session: prev.session + 1 }));
  }

  const s = open ? student : shown.student;
  const m = open ? mode : shown.mode;
  const missing = m !== "create" && !s;

  return (
    <Dialog open={open} onClose={onClose} variant="sheet" labelledBy="student-sheet-title">
      <div className="sheet">
        <div className="sheet-topbar">
          <span className="sheet-crumb">
            <Users aria-hidden="true" /> Students <ChevronRight aria-hidden="true" />
            <strong className="truncate">{m === "create" ? "New student" : s ? studentCode(s.id) : "—"}</strong>
          </span>
          <span className="sheet-topbar-actions">
            {m === "view" && s && <CopyButton value={window.location.href} label="Copy link" />}
            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close panel">
              <X aria-hidden="true" />
            </button>
          </span>
        </div>

        {missing ? (
          <div className="sheet-body">
            <p className="muted" id="student-sheet-title">
              This student record no longer exists.
            </p>
          </div>
        ) : m === "view" ? (
          <StudentView student={s} onEdit={onEdit} onDelete={() => onDelete(s)} onOpenStudent={onOpenStudent} />
        ) : (
          <StudentForm
            key={`${m}-${s?.id ?? "new"}-${shown.session}`}
            mode={m}
            student={s}
            onCancel={m === "edit" ? onCancelEdit : onClose}
            onSaved={onSaved}
          />
        )}
      </div>
    </Dialog>
  );
}
