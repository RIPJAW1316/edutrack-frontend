import { Children, useId, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Dialog } from "./Dialog";
import { Spinner } from "./ui";

/**
 * Destructive-action confirmation. Pass `requireText` for type-to-confirm.
 * Keep the props stable while closing so the exit transition shows real content.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  requireText,
  children,
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTyped("");
      setBusy(false);
    }
  }

  const matches = !requireText || typed.trim().toUpperCase() === String(requireText).toUpperCase();

  const run = async () => {
    if (!matches || busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      /* caller reports the error */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      dismissible={!busy}
      labelledBy={`${id}-title`}
      describedBy={`${id}-desc`}
    >
      <div className="dialog-header">
        <div>
          <div className="dialog-icon dialog-icon-danger">
            <TriangleAlert aria-hidden="true" />
          </div>
          <h2 className="dialog-title" id={`${id}-title`}>
            {title}
          </h2>
          <p className="dialog-desc" id={`${id}-desc`}>
            {description}
          </p>
        </div>
      </div>

      {(Children.toArray(children).length > 0 || requireText) && (
        <div className="dialog-body">
          {children}
          {requireText && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run();
              }}
            >
              <label className="confirm-input-label" htmlFor={`${id}-confirm`}>
                Type <strong className="mono">{requireText}</strong> to confirm
              </label>
              <input
                id={`${id}-confirm`}
                className="input mono"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                data-autofocus
              />
            </form>
          )}
        </div>
      )}

      <div className="dialog-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy} data-autofocus={requireText ? undefined : true}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={run} disabled={!matches || busy}>
          {busy && <Spinner />}
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
