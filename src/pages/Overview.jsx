import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  CircleCheck,
  Command,
  Eye,
  GraduationCap,
  Landmark,
  RefreshCw,
  ServerCrash,
  ShieldCheck,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import { BarList, SplitBar } from "../components/charts";
import { Menu, MenuItem, MenuLabel } from "../components/Menu";
import { Avatar, DeptChip, EmptyState, Kbd, RoleBadge } from "../components/ui";
import { useData, useToast } from "../lib/contexts";
import { modKey } from "../lib/hotkeys";
import { errorMessage, firstName, greeting, longDate, pluralize, studentCode } from "../lib/format";

function Kpi({ icon: Icon, label, value, suffix, children, index, loading }) {
  return (
    <section className="card kpi" style={{ "--i": index }} aria-label={label}>
      <div className="kpi-head">
        <span>{label}</span>
        <Icon aria-hidden="true" />
      </div>
      <div className="kpi-value">
        {loading ? <span className="skeleton" style={{ width: 72, height: 28 }} /> : value}
        {!loading && suffix && <small>{suffix}</small>}
      </div>
      {loading ? <span className="skeleton" style={{ width: "70%", marginTop: "auto" }} /> : children}
    </section>
  );
}

function SkeletonRows({ count = 5 }) {
  return Array.from({ length: count }, (_, i) => (
    <div className="list-row" key={i}>
      <span className="skeleton" style={{ width: 28, height: 28, borderRadius: "50%" }} />
      <span style={{ display: "grid", gap: 6, flex: 1 }}>
        <span className="skeleton" style={{ width: "40%" }} />
        <span className="skeleton" style={{ width: "60%", height: 10 }} />
      </span>
    </div>
  ));
}

export default function Overview() {
  const navigate = useNavigate();
  const { openPalette } = useOutletContext();
  const { toast } = useToast();
  const { students, departments, status, refresh, me, currentUser, isAdmin, deptColor, deptById, updateStudent } =
    useData();

  if (status === "error") {
    return (
      <div className="page">
        <div className="card">
          <EmptyState
            icon={ServerCrash}
            title="Can't reach the EduTrack API"
            description="The Spring Boot backend on localhost:8081 isn't responding. Start it, then retry."
          >
            <button type="button" className="btn btn-primary" onClick={refresh}>
              <RefreshCw aria-hidden="true" /> Retry connection
            </button>
          </EmptyState>
        </div>
      </div>
    );
  }

  const loading = status === "loading";
  const total = students.length;
  const admins = students.filter((s) => s.role === "ADMIN").length;
  const learners = total - admins;
  const unassigned = students.filter((s) => !s.departmentId);
  const assigned = total - unassigned.length;
  const coverage = total ? assigned / total : 0;
  const activeDepts = departments.filter((d) => (d.studentCount || 0) > 0);
  const emptyDepts = departments.filter((d) => !(d.studentCount > 0));
  const bySize = [...departments].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0));
  const largest = bySize[0];
  const average = departments.length ? assigned / departments.length : 0;
  const latest = [...students].sort((a, b) => b.id - a.id).slice(0, 6);
  const name = firstName(me?.name) || currentUser?.email?.split("@")[0];

  const barRows = bySize.map((d) => ({
    key: d.id,
    label: d.code || "—",
    sublabel: d.name,
    value: d.studentCount || 0,
    color: deptColor(d.id),
    to: `/dashboard/students?dept=${d.id}`,
  }));
  if (unassigned.length) {
    barRows.push({
      key: "none",
      label: "None",
      sublabel: "Unassigned",
      value: unassigned.length,
      muted: true,
      to: "/dashboard/students?dept=none",
    });
  }

  const assign = async (student, dept) => {
    try {
      await updateStudent(student.id, {
        name: student.name,
        email: student.email,
        role: student.role,
        departmentId: dept.id,
      });
      toast({ title: `${student.name} assigned`, description: `Now enrolled in ${dept.name}.` });
    } catch (err) {
      toast({ tone: "error", title: "Couldn't assign department", description: errorMessage(err) });
    }
  };

  const myDept = me?.departmentId ? deptById.get(me.departmentId) : null;
  const classmates = me?.departmentId
    ? students.filter((s) => s.departmentId === me.departmentId && s.id !== me.id)
    : [];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="overview-eyebrow">
            <CalendarDays aria-hidden="true" /> {longDate()}
          </p>
          <h1 className="page-title">
            {greeting()}
            {name ? `, ${name}` : ""}
          </h1>
          <p className="page-desc">Here&apos;s the state of your campus records right now.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={openPalette}>
            <Command aria-hidden="true" /> Command menu
            <span className="kbd-group" aria-hidden="true">
              <Kbd>{modKey}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          {isAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/dashboard/students?new=1", { viewTransition: true })}
            >
              <UserPlus aria-hidden="true" /> Enroll student
            </button>
          )}
        </div>
      </header>

      <div className="kpi-grid">
        <Kpi icon={Users} label="Total accounts" value={total.toLocaleString()} index={0} loading={loading}>
          <p className="kpi-foot">
            <strong>{learners}</strong> {learners === 1 ? "student" : "students"} · <strong>{admins}</strong>{" "}
            {admins === 1 ? "admin" : "admins"}
          </p>
        </Kpi>
        <Kpi icon={Landmark} label="Departments" value={departments.length} index={1} loading={loading}>
          <p className="kpi-foot">
            <strong>{activeDepts.length}</strong> with students · <strong>{emptyDepts.length}</strong> empty
          </p>
        </Kpi>
        <Kpi
          icon={Target}
          label="Department coverage"
          value={Math.round(coverage * 100)}
          suffix="%"
          index={2}
          loading={loading}
        >
          <div style={{ display: "grid", gap: 8, marginTop: "auto" }}>
            <div
              className="meter"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(coverage * 100)}
              aria-label="Accounts assigned to a department"
            >
              <span style={{ width: `${coverage * 100}%` }} />
            </div>
            <p className="kpi-foot" style={{ marginTop: 0 }}>
              <strong>{assigned}</strong> of {total} assigned
            </p>
          </div>
        </Kpi>
        <Kpi
          icon={ChartColumn}
          label="Avg. per department"
          value={average.toFixed(1)}
          index={3}
          loading={loading}
        >
          <p className="kpi-foot">
            {largest && largest.studentCount > 0 ? (
              <>
                Largest: <strong>{largest.code}</strong> with {pluralize(largest.studentCount, "account")}
              </>
            ) : (
              "No enrollments yet"
            )}
          </p>
        </Kpi>
      </div>

      <div className="overview-grid">
        <section className="card" aria-labelledby="enrollment-title">
          <div className="card-header">
            <div>
              <h2 className="card-title" id="enrollment-title">
                Enrollment by department
              </h2>
              <p className="card-desc">Accounts assigned to each department · select a row to filter</p>
            </div>
            <Link to="/dashboard/departments" viewTransition className="card-link">
              Departments <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          <div className="card-body">
            {loading ? (
              <div style={{ display: "grid", gap: 16, padding: "6px 0" }}>
                {Array.from({ length: 4 }, (_, i) => (
                  <span key={i} className="skeleton" style={{ width: `${80 - i * 15}%`, height: 10 }} />
                ))}
              </div>
            ) : barRows.length ? (
              <BarList rows={barRows} total={total} unit="account" />
            ) : (
              <EmptyState icon={Landmark} title="No departments yet" description="Create a department to start grouping students." />
            )}
          </div>
        </section>

        <section className="card" aria-labelledby="composition-title">
          <div className="card-header">
            <div>
              <h2 className="card-title" id="composition-title">
                Access composition
              </h2>
              <p className="card-desc">Accounts by platform role</p>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <span className="skeleton" style={{ height: 10 }} />
            ) : (
              <SplitBar
                label={`${learners} students and ${admins} administrators`}
                segments={[
                  { key: "students", label: "Students", value: learners, color: "var(--accent)" },
                  { key: "admins", label: "Administrators", value: admins, color: "var(--mark-muted)" },
                ]}
              />
            )}
            <div className="access-notes">
              <p className="access-note">
                <ShieldCheck aria-hidden="true" />
                <span>
                  <strong>Administrators</strong> can enroll, edit and remove students and departments.
                </span>
              </p>
              <p className="access-note">
                <GraduationCap aria-hidden="true" />
                <span>
                  <strong>Students</strong> can browse the directory and departments, read-only.
                </span>
              </p>
              {!isAdmin && (
                <p className="access-note">
                  <Eye aria-hidden="true" />
                  <span>You&apos;re signed in with read-only access.</span>
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="overview-grid">
        <section className="card" aria-labelledby="latest-title">
          <div className="card-header">
            <div>
              <h2 className="card-title" id="latest-title">
                Recently added
              </h2>
              <p className="card-desc">Newest records by enrollment ID</p>
            </div>
            <Link to="/dashboard/students" viewTransition className="card-link">
              All students <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          <div className="card-list">
            {loading ? (
              <SkeletonRows />
            ) : latest.length ? (
              latest.map((s) => (
                <Link key={s.id} to={`/dashboard/students?student=${s.id}`} className="list-row">
                  <Avatar name={s.name} seed={s.email} />
                  <span className="list-main">
                    <span className="list-title truncate">{s.name}</span>
                    <span className="list-sub truncate">{s.email}</span>
                  </span>
                  <span className="list-aside">
                    <span className="col-hide-sm">
                      <DeptChip code={s.departmentCode} name={s.departmentName} color={deptColor(s.departmentId)} showName={false} />
                    </span>
                    <span className="mono subtle col-hide-sm" style={{ fontSize: 12 }}>
                      {studentCode(s.id)}
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState icon={Users} title="No students yet" description="Enrolled students will appear here." />
            )}
          </div>
        </section>

        {isAdmin ? (
          <section className="card" aria-labelledby="attention-title">
            <div className="card-header">
              <div>
                <h2 className="card-title" id="attention-title">
                  Needs attention
                </h2>
                <p className="card-desc">Unassigned accounts and empty departments</p>
              </div>
            </div>
            <div className="card-list">
              {loading ? (
                <SkeletonRows count={3} />
              ) : unassigned.length === 0 && emptyDepts.length === 0 ? (
                <div className="all-clear">
                  <span className="all-clear-icon">
                    <CircleCheck aria-hidden="true" />
                  </span>
                  <span>All clear — every account has a department and every department has students.</span>
                </div>
              ) : (
                <>
                  {unassigned.slice(0, 5).map((s) => (
                    <div key={s.id} className="list-row">
                      <Avatar name={s.name} seed={s.email} />
                      <Link to={`/dashboard/students?student=${s.id}`} className="list-main">
                        <span className="list-title truncate">{s.name}</span>
                        <span className="list-sub">No department</span>
                      </Link>
                      <span className="list-aside">
                        <Menu
                          label={`Assign ${s.name} to a department`}
                          trigger={(props) => (
                            <button type="button" className="btn btn-secondary btn-sm" {...props}>
                              Assign
                            </button>
                          )}
                        >
                          <MenuLabel>Assign to department</MenuLabel>
                          {departments.map((d) => (
                            <MenuItem key={d.id} meta={d.code} onSelect={() => assign(s, d)}>
                              {d.name}
                            </MenuItem>
                          ))}
                        </Menu>
                      </span>
                    </div>
                  ))}
                  {emptyDepts.slice(0, 4).map((d) => (
                    <Link key={d.id} to={`/dashboard/departments?open=${d.id}`} className="list-row">
                      <span className="dept-tile" style={{ "--c": deptColor(d.id), minWidth: 28, height: 28, borderRadius: 8, fontSize: 9.5 }}>
                        {d.code?.slice(0, 4)}
                      </span>
                      <span className="list-main">
                        <span className="list-title truncate">{d.name}</span>
                        <span className="list-sub">No students enrolled</span>
                      </span>
                      <span className="list-aside">
                        <span className="badge badge-warning">Empty</span>
                      </span>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </section>
        ) : (
          <section className="card" aria-labelledby="mine-title">
            <div className="card-header">
              <div>
                <h2 className="card-title" id="mine-title">
                  Your enrollment
                </h2>
                <p className="card-desc">Your record as stored in EduTrack</p>
              </div>
              <Link to="/dashboard/account" viewTransition className="card-link">
                Account <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
            <div className="card-body">
              {loading ? (
                <SkeletonRows count={2} />
              ) : me ? (
                <div style={{ display: "grid", gap: 16 }}>
                  <div className="profile-head">
                    <Avatar name={me.name} seed={me.email} size="lg" />
                    <div style={{ minWidth: 0 }}>
                      <p className="list-title">{me.name}</p>
                      <p className="list-sub">
                        {me.email} · <span className="mono">{studentCode(me.id)}</span>
                      </p>
                    </div>
                    <span style={{ marginLeft: "auto" }}>
                      <RoleBadge role={me.role} />
                    </span>
                  </div>
                  {myDept ? (
                    <div className="info-card">
                      <div className="info-card-head">
                        <span className="dept-tile" style={{ "--c": deptColor(myDept.id) }}>
                          {myDept.code}
                        </span>
                        <div>
                          <p className="list-title">{myDept.name}</p>
                          <p className="list-sub">
                            {classmates.length
                              ? `${pluralize(classmates.length, "other member")} in this department`
                              : "You're the only member so far"}
                          </p>
                        </div>
                      </div>
                      {myDept.description && <p>{myDept.description}</p>}
                    </div>
                  ) : (
                    <p className="muted">You haven&apos;t been assigned to a department yet.</p>
                  )}
                </div>
              ) : (
                <p className="muted">We couldn&apos;t find your record in the directory.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
