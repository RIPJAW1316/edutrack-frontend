import { Keyboard, X } from "lucide-react";
import { Dialog } from "../components/Dialog";
import { Kbd } from "../components/ui";
import { modKey } from "../lib/hotkeys";

const GROUPS = [
  {
    title: "General",
    rows: [
      ["Open command menu", [modKey, "K"]],
      ["Show shortcuts", ["?"]],
      ["Focus search", ["/"]],
      ["Create in current view", ["C"]],
      ["Close panel or dialog", ["Esc"]],
    ],
  },
  {
    title: "Navigation",
    rows: [
      ["Go to Overview", ["G", "O"]],
      ["Go to Students", ["G", "S"]],
      ["Go to Departments", ["G", "D"]],
      ["Go to Account", ["G", "A"]],
    ],
  },
];

export function ShortcutsDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="shortcuts-title" className="shortcuts-dialog">
      <div className="dialog-header">
        <div>
          <div className="dialog-icon">
            <Keyboard aria-hidden="true" />
          </div>
          <h2 className="dialog-title" id="shortcuts-title">
            Keyboard shortcuts
          </h2>
          <p className="dialog-desc">Move through EduTrack without leaving the keyboard.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
          <X aria-hidden="true" />
        </button>
      </div>
      <div className="dialog-body">
        <div className="shortcut-groups">
          {GROUPS.map((g) => (
            <section className="shortcut-group" key={g.title}>
              <h3>{g.title}</h3>
              {g.rows.map(([label, keys]) => (
                <div className="shortcut-row" key={label}>
                  <span>{label}</span>
                  <span className="kbd-group">
                    {keys.map((k, i) => (
                      <Kbd key={i}>{k}</Kbd>
                    ))}
                  </span>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
