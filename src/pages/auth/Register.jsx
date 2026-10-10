import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CircleAlert, Eye, EyeOff, GraduationCap, Lock, Mail, ShieldCheck, User, WandSparkles } from "lucide-react";
import { authService } from "../../api";
import { Field, Segmented, Select, Spinner } from "../../components/ui";
import { errorMessage, generatePassword, passwordStrength } from "../../lib/format";
import { AuthLayout } from "./AuthLayout";
import { usePublicDepartments } from "./usePublicDepartments";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRENGTH = ["Too short", "Weak", "Fair", "Good", "Strong"];

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Enter your full name.";
  if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.password.length < 8) errors.password = "Use at least 8 characters.";
  return errors;
}

export default function Register() {
  const navigate = useNavigate();
  const showcase = usePublicDepartments();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT", departmentId: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
    if (formError) setFormError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const result = await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
      });
      // Bean-validation failures come back as 200 + { field: message }
      if (result && typeof result === "object" && !("id" in result)) {
        setErrors(result);
        setSubmitting(false);
        return;
      }
      navigate("/", { state: { registered: true, email: form.email.trim() }, viewTransition: true });
    } catch (err) {
      setFormError(errorMessage(err, "We couldn't create that account. The email may already be registered."));
      setSubmitting(false);
    }
  };

  const score = passwordStrength(form.password);

  return (
    <AuthLayout
      showcase={showcase}
      topAction={
        <span>
          Already have an account? <Link to="/">Sign in</Link>
        </span>
      }
    >
      <div className="auth-form">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Get access to the EduTrack workspace in under a minute.</p>

        {formError && (
          <div className="callout callout-danger auth-notice" role="alert">
            <CircleAlert aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <form className="auth-fields" onSubmit={onSubmit} noValidate>
          <Field label="Full name" htmlFor="name" error={errors.name}>
            <span className="input-wrap">
              <User className="input-lead" aria-hidden="true" />
              <input
                id="name"
                className="input input-lg"
                placeholder="Aryan Reddy"
                autoComplete="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                autoFocus
              />
            </span>
          </Field>

          <Field label="Email" htmlFor="email" error={errors.email}>
            <span className="input-wrap">
              <Mail className="input-lead" aria-hidden="true" />
              <input
                id="email"
                type="email"
                className="input input-lg"
                placeholder="you@university.edu"
                autoComplete="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </span>
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            error={errors.password}
            hint={form.password ? `Strength: ${STRENGTH[score]}` : "At least 8 characters. Mix cases, numbers and symbols."}
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
              <Lock className="input-lead" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input input-lg"
                placeholder="Create a password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : "password-hint"}
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
              </span>
            </span>
            {form.password && (
              <div className="pw-meter" data-score={score} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            )}
          </Field>

          <div className="form-row">
            <Field label="Role">
              <Segmented
                label="Role"
                block
                value={form.role}
                onChange={(v) => set("role", v)}
                options={[
                  { value: "STUDENT", label: "Student", icon: GraduationCap },
                  { value: "ADMIN", label: "Admin", icon: ShieldCheck },
                ]}
              />
            </Field>
            <Field label="Department" htmlFor="departmentId">
              <Select
                id="departmentId"
                value={form.departmentId}
                onChange={(e) => set("departmentId", e.target.value)}
                disabled={showcase.status !== "ready"}
              >
                <option value="">No department</option>
                {showcase.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code ? `${d.code} — ` : ""}
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner /> Creating account…
              </>
            ) : (
              <>
                Create account <ArrowRight aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
