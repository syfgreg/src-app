import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { useApp } from "../context/AppContext";
import { AdminPage, type Section as AdminSection } from "../pages/AdminPage";
import { RecordsPage } from "../pages/RecordsPage";
import { NewsletterPage } from "../pages/NewsletterPage";
import { FindAnglerPage } from "../pages/FindAnglerPage";
import { LoginPage } from "../pages/LoginPage";
import { needsRuling } from "../pages/ScorecardsReviewPage";
import { computeStandings } from "../domain/standings";
import { HALL_OF_FAME } from "../domain/accolades";
import { Icon, type IconName } from "../components/Icon";

type Nav = "dashboard" | "metrics" | "tournaments" | "roster" | "history" | "catches" | "records" | "newsletters";

const NAV_ITEMS: { key: Nav; label: string; icon: IconName }[] = [
  { key: "dashboard", label: "Dashboard", icon: "grid" },
  { key: "metrics", label: "Metrics", icon: "award" },
  { key: "tournaments", label: "Tournaments", icon: "trophy" },
  { key: "roster", label: "Anglers & Roster", icon: "user" },
  { key: "history", label: "Angler History", icon: "search" },
  { key: "catches", label: "Catch Review", icon: "scorecard" },
  { key: "records", label: "Record Book", icon: "rules" },
  { key: "newsletters", label: "Newsletters", icon: "message" },
];

/** Desktop M.O.C. console — a second entry point (command.html) over the same
 * database and code as the mobile app. Reuses existing pages/domain logic
 * wholesale; only Dashboard and Metrics are new (thin, no new business logic). */
export function CommandApp() {
  const { user, ready, logout } = useApp();
  const [nav, setNav] = useState<Nav>("dashboard");

  if (!ready) return null;
  if (!user) return <LoginPage />;
  if (user.roleTag !== "MOC") {
    return (
      <div className="cc-blocked">
        <p>The Command Center is M.O.C.-only.</p>
        <button className="btn ghost" onClick={logout}>Log out</button>
      </div>
    );
  }

  const goDashboard = () => setNav("dashboard");
  const adminSectionFor: Partial<Record<Nav, AdminSection>> = {
    tournaments: "tournament",
    roster: "roster",
    catches: "scorecards",
  };

  return (
    <div className="cc-shell">
      <nav className="cc-nav">
        <div className="cc-brand">Sea Robin Command</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`cc-nav-item ${nav === item.key ? "active" : ""}`}
            onClick={() => setNav(item.key)}
          >
            <Icon name={item.icon} size={17} />
            {item.label}
          </button>
        ))}
        <button className="cc-nav-item cc-logout" onClick={logout}>
          <Icon name="logout" size={17} />
          Log out
        </button>
      </nav>
      <main className="cc-content">
        {nav === "dashboard" && <Dashboard onNavigate={setNav} />}
        {nav === "metrics" && <Metrics />}
        {nav === "history" && <FindAnglerPage onBack={goDashboard} />}
        {nav === "records" && <RecordsPage onBack={goDashboard} />}
        {nav === "newsletters" && <NewsletterPage onBack={goDashboard} />}
        {adminSectionFor[nav] && (
          <AdminPage onBack={goDashboard} initialSection={adminSectionFor[nav]} />
        )}
      </main>
    </div>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (n: Nav) => void }) {
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const catches = useLiveQuery(() => db.catches.where("tournamentYear").equals(year).toArray(), [year], []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const approved = catches.filter((c) => c.status === "APPROVED");
  const pending = catches.filter(needsRuling).length;

  const cards: { label: string; value: number; nav?: Nav }[] = [
    { label: "Fish landed this tournament", value: approved.length },
    { label: "Rulings needed", value: pending, nav: "catches" },
    { label: "Registered anglers", value: users.length, nav: "roster" },
  ];

  return (
    <div className="page">
      <div className="page-kicker">{settings?.state ?? "SETUP"} · S.R.C. {year}</div>
      <h2 className="page-title">Dashboard</h2>
      <div className="cc-cards">
        {cards.map((c) => (
          <button key={c.label} className="card cc-stat" onClick={() => c.nav && onNavigate(c.nav)}>
            <div className="cc-stat-value">{c.value}</div>
            <div className="cc-stat-label">{c.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Metrics() {
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const year = settings?.tournamentYear ?? new Date().getFullYear();
  const catches = useLiveQuery(() => db.catches.where("tournamentYear").equals(year).toArray(), [year], []);
  const penalties = useLiveQuery(() => db.penalties.where("tournamentYear").equals(year).toArray(), [year], []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);

  const penByUser = new Map<string, number>();
  for (const p of penalties) penByUser.set(p.userId, (penByUser.get(p.userId) ?? 0) + p.points);
  const standings = computeStandings(catches, penByUser);
  const nameById = new Map(users.map((u) => [u.id, u.name]));
  const careerTop = [...HALL_OF_FAME].sort((a, b) => (b.careerTotal || 0) - (a.careerTotal || 0)).slice(0, 10);

  return (
    <div className="page">
      <div className="page-kicker">S.R.C. {year}</div>
      <h2 className="page-title">Metrics</h2>

      <div className="card">
        <h3>Current standings</h3>
        {standings.length === 0 ? (
          <p style={{ color: "var(--sand-faint)", fontSize: 13 }}>No verified catches yet this tournament.</p>
        ) : (
          standings.map((s, i) => (
            <div className="history-row" key={s.userId}>
              <div style={{ width: 24, color: "var(--sand-faint)" }}>{i + 1}</div>
              <div style={{ flex: 1 }}>{nameById.get(s.userId) ?? "Unknown angler"}</div>
              <div style={{ fontWeight: 700 }}>{s.total.toLocaleString()}</div>
            </div>
          ))
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Career leaderboard — top 10</h3>
        {careerTop.map((a, i) => (
          <div className="history-row" key={a.id}>
            <div style={{ width: 24, color: "var(--sand-faint)" }}>{i + 1}</div>
            <div style={{ flex: 1 }}>{a.name}</div>
            <div style={{ fontWeight: 700 }}>{(a.careerTotal || 0).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
