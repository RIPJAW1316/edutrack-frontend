import { useCallback, useEffect, useMemo, useState } from "react";
import { authService, departmentService, studentService } from "../api";
import { DataContext } from "../lib/contexts";

/**
 * The backend answers bean-validation failures with HTTP 200 and a
 * { field: message } map instead of the entity. Treat that as an error.
 */
class ValidationError extends Error {
  constructor(fields) {
    super(Object.values(fields)[0] || "Validation failed");
    this.fields = fields;
  }
}

function ensureEntity(result) {
  if (result && typeof result === "object" && !("id" in result)) {
    throw new ValidationError(result);
  }
  return result;
}

export function DataProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  // loading → first fetch · ready · error → never loaded · offline → loaded once, now failing
  const [status, setStatus] = useState("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [latency, setLatency] = useState(null);
  const [syncedAt, setSyncedAt] = useState(null);
  const [currentUser] = useState(() => authService.getCurrentUser());

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const started = performance.now();
    try {
      const [s, d] = await Promise.all([studentService.getAll(), departmentService.getAll()]);
      setStudents(Array.isArray(s) ? s : []);
      setDepartments(Array.isArray(d) ? d : []);
      setLatency(Math.round(performance.now() - started));
      setSyncedAt(new Date());
      setStatus("ready");
      return true;
    } catch {
      setStatus((prev) => (prev === "ready" || prev === "offline" ? "offline" : "error"));
      return false;
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mutate = useCallback(
    async (operation) => {
      const result = await operation();
      await refresh();
      return result;
    },
    [refresh]
  );

  const actions = useMemo(
    () => ({
      createStudent: (payload) => mutate(async () => ensureEntity(await studentService.create(payload))),
      updateStudent: (id, payload) => mutate(async () => ensureEntity(await studentService.update(id, payload))),
      deleteStudent: (id) => mutate(() => studentService.delete(id)),
      deleteStudents: (ids) => mutate(() => Promise.allSettled(ids.map((id) => studentService.delete(id)))),
      moveStudents: (list, departmentId) =>
        mutate(() =>
          Promise.allSettled(
            list.map((s) =>
              studentService.update(s.id, { name: s.name, email: s.email, role: s.role, departmentId })
            )
          )
        ),
      createDepartment: (payload) => mutate(async () => ensureEntity(await departmentService.create(payload))),
      updateDepartment: (id, payload) =>
        mutate(async () => ensureEntity(await departmentService.update(id, payload))),
      deleteDepartment: (id) => mutate(() => departmentService.delete(id)),
    }),
    [mutate]
  );

  // Department identity colour: fixed categorical slot by creation order (id), never by rank.
  const deptById = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments]);
  const deptSlot = useMemo(() => {
    const ordered = [...departments].sort((a, b) => a.id - b.id);
    return new Map(ordered.map((d, i) => [d.id, i]));
  }, [departments]);

  const deptColor = useCallback(
    (id) => {
      const slot = deptSlot.get(id);
      return slot != null && slot < 8 ? `var(--cat-${slot + 1})` : "var(--cat-none)";
    },
    [deptSlot]
  );

  const me = useMemo(
    () => students.find((s) => s.id === currentUser?.id) ?? null,
    [students, currentUser]
  );

  const role = me?.role ?? currentUser?.role ?? "STUDENT";

  const value = useMemo(
    () => ({
      students,
      departments,
      status,
      refreshing,
      latency,
      syncedAt,
      refresh,
      currentUser,
      me,
      role,
      isAdmin: role === "ADMIN",
      deptById,
      deptColor,
      ...actions,
    }),
    [students, departments, status, refreshing, latency, syncedAt, refresh, currentUser, me, role, deptById, deptColor, actions]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
