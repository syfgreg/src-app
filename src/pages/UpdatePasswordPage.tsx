import { useState } from "react";
import { useApp } from "../context/AppContext";

/**
 * Shown when the user arrives via a password-reset link (Supabase fires a
 * PASSWORD_RECOVERY auth event). They set a new password, then drop into the app.
 */
export function UpdatePasswordPage() {
  const { updatePassword, logout } = useApp();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    const err = await updatePassword(password);
    if (err) setError(err);
    setBusy(false);
  };

  return (
    <div className="app-shell">
      <div className="login-hero">
        <div className="badge">
          <img src="/logo.png" alt="Sea Robin Classic logo" />
        </div>
        <h1>
          NEW <em>PASSWORD</em>
        </h1>
        <p>Set a new password to get back on the beach</p>
      </div>
      <div className="page">
        <form className="card" onSubmit={submit}>
          <label className="field">
            <span>New password</span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </label>
          <label className="field">
            <span>Confirm new password</span>
            <input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </label>
          <label
            className="field"
            style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -2 }}
          >
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              style={{ width: "auto" }}
            />
            <span style={{ margin: 0 }}>Show password</span>
          </label>

          {error && <p className="error-note">{error}</p>}
          <button className="btn" disabled={busy}>
            {busy ? "Saving…" : "Save new password"}
          </button>
          <button
            type="button"
            className="btn ghost"
            style={{ marginTop: 8 }}
            onClick={logout}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
