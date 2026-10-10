import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUp,
  CircleAlert,
  CircleCheck,
  Clock,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { authService } from "../../api";
import { Field, Spinner } from "../../components/ui";
import { errorMessage } from "../../lib/format";
import { hasValidSession } from "../../lib/session";
import { AuthLayout } from "./AuthLayout";
import { usePublicDepartments } from "./usePublicDepartments";

const DEMO = {
  admin: { email: "admin@edutrack.com", password: "admin123" },
  student: { email: "student@edutrack.com", password: "student123" },
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const showcase = usePublicDepartments();
  const [form, setForm] = useState({ email: location.state?.email ?? "", password: "" });
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const reason = location.state?.reason;
  const registered = location.state?.registered;

  // Drop an expired token left behind so it isn't sent with future requests
  useEffect(() => {
    if (authService.isAuthenticated() && !hasValidSession()) authService.logout();
  }, []);

  const signIn = async (credentials, source) => {
    setPending(source);
    setError("");
    try {
      await authService.login(credentials);
      navigate(location.state?.from || "/dashboard", { replace: true, viewTransition: true });
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "That email and password combination doesn't match our records."
          : errorMessage(err, "Sign-in failed. Please try again.")
      );
      setPending(null);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Enter your email and password to continue.");
      return;
    }
    signIn(form, "form");
  };

  const signInAsDemo = (key) => {
    setForm(DEMO[key]);
    signIn(DEMO[key], key);
  };

  const update = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const busy = pending !== null;

  return (
    <AuthLayout
      showcase={showcase}
      topAction={
        <span>
          New to EduTrack? <Link to="/register">Create an account</Link>
        </span>
      }
    >
      <div className="auth-form">
        <span className="auth-pill">
          <span
            className="status-dot"
            data-state={showcase.status === "ready" ? "online" : showcase.status === "error" ? "offline" : "pending"}
          />
          {showcase.status === "ready"
            ? "All systems operational"
            : showcase.status === "error"
              ? "API unreachable on :8081"
              : "Checking API status…"}
        </span>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your EduTrack workspace.</p>

        {reason === "expired" && !error && (
          <div className="callout callout-warning auth-notice" role="status">
            <Clock aria-hidden="true" />
            <span>Your session expired for security. Please sign in again.</span>
          </div>
        )}
        {registered && !error && (
          <div className="callout callout-success auth-notice" role="status">
            <CircleCheck aria-hidden="true" />
            <span>Account created. Sign in with your new credentials.</span>
          </div>
        )}
        {error && (
          <div className="callout callout-danger auth-notice" role="alert">
            <CircleAlert aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-fields" onSubmit={onSubmit} noValidate>
          <Field label="Email" htmlFor="email">
            <span className="input-wrap">
              <Mail className="input-lead" aria-hidden="true" />
              <input
                id="email"
                name="email"
                type="email"
                className="input input-lg"
                placeholder="you@university.edu"
                autoComplete="username"
                value={form.email}
                onChange={update}
                aria-invalid={!!error && !form.email}
                autoFocus={!form.email}
                required
              />
            </span>
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            aside={
              capsLock && (
                <span className="caps-hint">
                  <ArrowUp aria-hidden="true" /> Caps Lock is on
                </span>
              )
            }
          >
            <span className="input-wrap">
              <Lock className="input-lead" aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="input input-lg"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={form.password}
                onChange={update}
                onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock"))}
                onKeyDown={(e) => setCapsLock(e.getModifierState?.("CapsLock"))}
                aria-invalid={!!error && !form.password}
                autoFocus={!!form.email}
                required
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
          </Field>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {pending === "form" ? (
              <>
                <Spinner /> Signing in…
              </>
            ) : (
              <>
                Sign in <ArrowRight aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">or explore with a demo account</div>

        <div className="demo-grid">
          <button type="button" className="demo-card" onClick={() => signInAsDemo("admin")} disabled={busy}>
            <span className="demo-card-icon">{pending === "admin" ? <Spinner size={16} /> : <ShieldCheck />}</span>
            <span>
              <span className="demo-card-title">Administrator</span>
              <span className="demo-card-desc">Full read &amp; write access</span>
            </span>
          </button>
          <button
            type="button"
            className="demo-card"
            data-variant="student"
            onClick={() => signInAsDemo("student")}
            disabled={busy}
          >
            <span className="demo-card-icon">
              {pending === "student" ? <Spinner size={16} /> : <GraduationCap />}
            </span>
            <span>
              <span className="demo-card-title">Student</span>
              <span className="demo-card-desc">Read-only directory</span>
            </span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
