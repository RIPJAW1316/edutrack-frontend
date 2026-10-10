import { useEffect, useState } from "react";
import { departmentService } from "../../api";

// GET /departments is public, so auth screens can show live data and a health signal.
// `slow` flips on when the API takes a while — typically a free-tier server waking up.
export function usePublicDepartments() {
  const [state, setState] = useState({ departments: [], status: "loading" });
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => !cancelled && setSlow(true), 3500);
    departmentService
      .getAll()
      .then((data) => !cancelled && setState({ departments: Array.isArray(data) ? data : [], status: "ready" }))
      .catch(() => !cancelled && setState({ departments: [], status: "error" }))
      .finally(() => clearTimeout(timer));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return { ...state, slow: slow && state.status === "loading" };
}
