import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/contexts";
import { originFromEvent } from "../lib/dom";

export function ThemeToggle({ className = "btn btn-ghost btn-icon", tipPos }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => toggleTheme(originFromEvent(e))}
      aria-label={`Switch to ${next} theme`}
      data-tip={`${next === "dark" ? "Dark" : "Light"} mode`}
      data-tip-pos={tipPos}
    >
      {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}
