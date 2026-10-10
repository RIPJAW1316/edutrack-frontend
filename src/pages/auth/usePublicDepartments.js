import { useEffect, useState } from "react";
import { departmentService } from "../../api";

// GET /departments is public, so auth screens can show live data and a health signal.
export function usePublicDepartments() {
  const [state, setState] = useState({ departments: [], status: "loading" });

  useEffect(() => {
    let cancelled = false;
    departmentService
      .getAll()
      .then((data) => !cancelled && setState({ departments: Array.isArray(data) ? data : [], status: "ready" }))
      .catch(() => !cancelled && setState({ departments: [], status: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
