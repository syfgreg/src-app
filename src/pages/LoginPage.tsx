import { useState } from "react";
import { useApp } from "../context/AppContext";

export function LoginPage() {
  const { login, register } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err =
      mode === "login" ? await login(email, password) : await register(name, email, password);
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
          SEA ROBIN <em>CLASSIC</em>
        </h1>
        <p>Official Tournament App · Invite Only</p>
      </div>
      <div className="page">
        <form className="card" onSubmit={submit}>
          {mode === "register" && (
            <label className="field">
              <span>Angler Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sean Sullivan"
                autoComplete="name"
              />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          {error && <p className="error-note">{error}</p>}
          <button className="btn" disabled={busy}>
            {mode === "login" ? "Hit the Beach" : "Join the Roster"}
          </button>
          <button
            type="button"
            className="btn ghost"
            style={{ marginTop: 8 }}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "New here? Register (JAFNG)" : "Back to login"}
          </button>
        </form>
        <p style={{ color: "var(--sand-faint)", fontSize: 12.5, textAlign: "center" }}>
          M.O.C. demo login: moc@searobinclassic.com / searobin
        </p>
      </div>
    </div>
  );
}
