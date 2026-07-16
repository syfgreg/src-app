import { useState } from "react";
import { useApp } from "../context/AppContext";

export function CommandLoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await login(email, password);
    if (err) setError(err);
    setBusy(false);
  };

  return (
    <div className="cc-login-shell">
      <form className="card cc-login-card" onSubmit={submit}>
        <img src="/logo.png" alt="" className="cc-login-badge" />
        <h1 className="cc-login-title">M.O.C. Command Center</h1>
        <p className="cc-login-sub">Sea Robin Classic — full tournament control.</p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <p className="error-note">{error}</p>}
        <button className="btn" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
