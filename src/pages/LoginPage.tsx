import { useState } from "react";
import { useApp } from "../context/AppContext";
import pkg from "../../package.json";

export function LoginPage() {
  const { login, register, resetPassword, cloud } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const err =
      mode === "login" ? await login(email, password) : await register(name, nickname, email, password);
    if (err) setError(err);
    setBusy(false);
  };

  const forgot = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    const msg = await resetPassword(email);
    // resetPassword returns a friendly string on both success and validation
    // miss; only the "enter your email" / backend messages read as errors.
    if (msg?.startsWith("Check your email")) setNotice(msg);
    else setError(msg);
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
            <>
              <label className="field">
                <span>Angler Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sean Sullivan"
                  autoComplete="name"
                />
              </label>
              <label className="field">
                <span>Nickname (optional)</span>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder='"The Champ"'
                  autoComplete="off"
                />
              </label>
            </>
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
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
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
          {notice && <p className="ok-note">{notice}</p>}
          <button className="btn" disabled={busy}>
            {mode === "login" ? "Hit the Beach" : "Join the Roster"}
          </button>

          {mode === "login" && cloud && (
            <button
              type="button"
              className="btn ghost"
              style={{ marginTop: 8 }}
              disabled={busy}
              onClick={forgot}
            >
              Forgot password?
            </button>
          )}

          <button
            type="button"
            className="btn ghost"
            style={{ marginTop: 8 }}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
              setNotice(null);
            }}
          >
            {mode === "login" ? "New here? Register (JAFNG)" : "Back to login"}
          </button>
        </form>
        <p style={{ color: "var(--sand-faint)", fontSize: 11.5, textAlign: "center" }}>v{pkg.version}</p>
      </div>
    </div>
  );
}
