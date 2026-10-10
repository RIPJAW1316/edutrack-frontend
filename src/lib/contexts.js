import { createContext, useContext } from "react";

export const ThemeContext = createContext(null);
export const ToastContext = createContext(null);
export const DataContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);
export const useToast = () => useContext(ToastContext);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
