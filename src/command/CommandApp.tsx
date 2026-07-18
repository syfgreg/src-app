import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { useApp } from "../context/AppContext";
import { AdminPage, type Section as AdminSection } from "../pages/AdminPage";
import { RecordsPage } from "../pages/RecordsPage";
import { NewsletterPage } from "../pages/NewsletterPage";
import { CommandAnglerHistory } from "./CommandAnglerHistory";
import { CommandCatchReview } from "./CommandCatchReview";
import { CommandTournaments } from "./CommandTournaments";
import { CommandLoginPage } from "./CommandLoginPage";
import { needsRuling } from "../pages/ScorecardsReviewPage";
import { computeStandings } from "../domain/standings";
import { HALL_OF_FAME } from "../domain/accolades";
import { Icon, type IconName } from "../components/Icon";

type Nav = "dashboard" | "metrics" | "tournaments" | "roster" | "history" | "catches" | "records" | "newsletters";

const NAV_ITEMS: { key: Nav; label: string; icon: IconName }[] = [
  { key: "dashboard", label: "Dashboard", icon: "grid" },
  { key: "metrics", label: "Metrics", icon: "bolt" },
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
  if (!user) return <CommandLoginPage />;
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
    roster: "roster",
  };

  return (
    <div className="cc-shell">
      <nav className="cc-nav">
        <div className="cc-brand">
          <img src="/logo.png" alt="" className="cc-brand-logo" />
          <div>
            <div className="cc-brand-title">Command Center</div>
            <div className="cc-brand-sub">Sea Robin Classic</div>
          </div>
        </div>
        <div className="cc-nav-label">Operations</div>
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
        <div className="cc-profile">
          <div className="cc-profile-icon">
            <Icon name="shield" size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="cc-profile-name">{user.nickname ? `${user.name} "${user.nickname}"` : user.name}</div>
            <div className="cc-profile-meta">M.O.C. · {user.email}</div>
          </div>
        </div>
        <button className="cc-signout" onClick={logout}>
          <Icon name="logout" size={16} /> Sign out
        </button>
      </nav>
      <main className="cc-content">
        {nav === "dashboard" && <Dashboard onNavigate={setNav} />}
        {nav === "metrics" && <Metrics />}
        {nav === "history" && <CommandAnglerHistory />}
        {nav === "catches" && <CommandCatchReview />}
        {nav === "tournaments" && <CommandTournaments />}
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
  const currentTournament = useLiveQuery(async () => {
    const list = await db.tournaments.where("year").equals(year).toArray();
    return list.sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [year]);
  const catches = useLiveQuery(() => db.catches.where("tournamentYear").equals(year).toArray(), [year], []);
  const allCatches = useLiveQuery(() => db.catches.toArray(), [], []);
  const users = useLiveQuery(() => db.users.toArray(), [], []);
  const records = useLiveQuery(() => db.records.toArray(), [], []);
  const penalties = useLiveQuery(() => db.penalties.where("tournamentYear").equals(year).toArray(), [year], []);

  const approved = catches.filter((c) => c.status === "APPROVED");
  const pending = catches.filter(needsRuling).length;
  const totalPointsThisYear = approved.reduce((s, c) => s + c.pointValue, 0);
  const claimedRecords = records.filter((r) => r.lengthInches > 0);
  const largestFish = [...claimedRecords].sort((a, b) => b.lengthInches - a.lengthInches)[0];

  // "All-time" figures come from the career file (the real historical span),
  // not the newer tournaments registry table (which only has a few rows so far).
  const allTimeYears = new Set(HALL_OF_FAME.flatMap((a) => a.history.map(([y]) => y)));
  const allTimePoints = HALL_OF_FAME.reduce((s, a) => s + (a.careerTotal || 0), 0);

  const penByUser = new Map<string, number>();
  for (const p of penalties) penByUser.set(p.userId, (penByUser.get(p.userId) ?? 0) + p.points);
  const standings = computeStandings(catches, penByUser);
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  const cards: { label: string; value: string; sub?: string; icon: IconName; nav?: Nav; gold?: boolean }[] = [
    { label: "Tournaments", value: String(allTimeYears.size), icon: "trophy", nav: "tournaments" },
    { label: "Registered anglers", value: String(users.length), icon: "user", nav: "roster" },
    {
      label: "Approved catches",
      value: String(approved.length),
      sub: `${allCatches.length} submitted all-time`,
      icon: "fish",
      nav: "catches",
    },
    { label: "Total points scored", value: totalPointsThisYear.toLocaleString(), icon: "bolt", nav: "metrics" },
    { label: "Species records", value: String(claimedRecords.length), icon: "award", nav: "records", gold: true },
  ];

  return (
    <div className="page">
      <div className="page-kicker">Operations Overview</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <h2 className="page-title">Dashboard</h2>
        <div style={{ color: "var(--sand-faint)", fontSize: 13 }}>
          {allTimeYears.size} tournaments · {HALL_OF_FAME.length} anglers on record ·{" "}
          {allTimePoints.toLocaleString(undefined, { maximumFractionDigits: 2 })} all-time points
        </div>
      </div>

      <div className="cc-hero">
        <div className="cc-hero-info">
          <span className={`cc-pill ${(settings?.state ?? "SETUP").toLowerCase()}`}>{settings?.state ?? "SETUP"}</span>
          <div className="cc-hero-name">{currentTournament?.name ?? `Sea Robin Classic ${year}`}</div>
          <div className="cc-hero-sub">
            Season {year} · {pending === 0 ? "no cards pending" : `${pending} ${pending === 1 ? "card" : "cards"} pending`}
          </div>
        </div>
        <div className="cc-hero-count">
          <div className="cc-hero-number">{approved.length}</div>
          <div className="cc-hero-label">Fish Landed</div>
        </div>
      </div>

      <div className="cc-cards">
        {cards.map((c) => (
          <button key={c.label} className="card cc-stat" onClick={() => c.nav && onNavigate(c.nav)}>
            <Icon name={c.icon} size={20} />
            <div className="cc-stat-value" style={c.gold ? { color: "var(--gold)" } : undefined}>{c.value}</div>
            <div className="cc-stat-label">{c.label}</div>
            {c.sub && <div className="cc-stat-sub">{c.sub}</div>}
          </button>
        ))}
        {largestFish && (
          <div className="card cc-stat">
            <Icon name="waves" size={20} />
            <div className="cc-stat-value">{largestFish.lengthInches}&quot;</div>
            <div className="cc-stat-label">Largest fish ever</div>
            <div className="cc-stat-sub">{largestFish.species} · {largestFish.holder}</div>
          </div>
        )}
      </div>

      <div className="cc-split">
        <div className="card">
          <h3>{year} Standings</h3>
          {standings.length === 0 ? (
            <p style={{ color: "var(--sand-faint)", fontSize: 13 }}>No scored catches yet this tournament.</p>
          ) : (
            standings.slice(0, 5).map((s, i) => (
              <div className="history-row" key={s.userId}>
                <div style={{ width: 24, color: "var(--sand-faint)" }}>{i + 1}</div>
                <div style={{ flex: 1 }}>{nameById.get(s.userId) ?? "Unknown angler"}</div>
                <div style={{ fontWeight: 700 }}>{s.total.toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
        <div className="card">
          <h3>Record Book Highlights</h3>
          {claimedRecords.length === 0 ? (
            <p style={{ color: "var(--sand-faint)", fontSize: 13 }}>No records on file.</p>
          ) : (
            [...claimedRecords]
              .sort((a, b) => b.lengthInches - a.lengthInches)
              .slice(0, 5)
              .map((r) => (
                <div className="history-row" key={r.species}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "var(--gold)" }}>{r.species}</div>
                    <div style={{ color: "var(--sand-faint)", fontSize: 12 }}>{r.holder} · {r.year}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--gold)" }}>{r.lengthInches}&quot;</div>
                </div>
              ))
          )}
        </div>
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
