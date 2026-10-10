import { createBrowserRouter, Navigate, RouterProvider, useLocation } from "react-router-dom";
import AppShell from "./layout/AppShell";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Overview from "./pages/Overview";
import Students from "./pages/Students";
import Departments from "./pages/Departments";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import { DataProvider } from "./providers/DataProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { ToastProvider } from "./providers/ToastProvider";
import { authService } from "./api";
import { hasValidSession } from "./lib/session";

function RequireAuth({ children }) {
  const location = useLocation();
  if (!hasValidSession()) {
    // Pure check — the login page clears the stale token in an effect
    const expired = authService.isAuthenticated();
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname + location.search, reason: expired ? "expired" : undefined }}
      />
    );
  }
  return children;
}

function RedirectIfAuthed({ children }) {
  return hasValidSession() ? <Navigate to="/dashboard" replace /> : children;
}

const router = createBrowserRouter([
  { path: "/", element: <RedirectIfAuthed><Login /></RedirectIfAuthed> },
  { path: "/login", element: <RedirectIfAuthed><Login /></RedirectIfAuthed> },
  { path: "/register", element: <Register /> },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <DataProvider>
          <AppShell />
        </DataProvider>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Overview /> },
      { path: "students", element: <Students /> },
      { path: "departments", element: <Departments /> },
      { path: "account", element: <Account /> },
    ],
  },
  { path: "/home", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <NotFound /> },
]);

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
  );
}
