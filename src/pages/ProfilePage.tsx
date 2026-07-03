import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { RoleBadge } from "../components/RoleBadge";
import { CatchCard } from "../components/CatchCard";

export function ProfilePage({ userId, onBack }: { userId: string; onBack: () => void }) {
  const user = useLiveQuery(() => db.users.get(userId), [userId]);
  const catches = useLiveQuery(
    () => db.catches.where("userId").equals(userId).reverse().sortBy("createdAt"),
    [userId],
    [],
  );

  if (!user) return null;

  const approved = catches.filter((c) => c.status === "APPROVED");
  const careerPoints = approved.reduce((s, c) => s + c.pointValue, 0);
  const largest = approved.reduce((m, c) => Math.max(m, c.lengthInches), 0);
  const seaRobins = approved.filter((c) => c.species === "Sea Robin").length;
  const trophies = approved.filter((c) => c.isTrophy).length;
  const recordsBroken = approved.filter((c) => c.isRecordBreaker).length;

  // Shiner Club: years fished with zero approved points
  const years = [...new Set(catches.map((c) => c.tournamentYear))];
  const shinerYears = years.filter(
    (y) => approved.filter((c) => c.tournamentYear === y).length === 0,
  );

  return (
    <div className="page">
      <button className="btn ghost small" onClick={onBack}>‹ Back</button>
      <div className="page-kicker" style={{ marginTop: 12 }}>Career file</div>
      <h2 className="page-title">
        {user.name}
        {user.nickname ? ` "${user.nickname}"` : ""}
      </h2>
      <p className="page-sub">
        <RoleBadge role={user.roleTag} /> · on the roster since{" "}
        {new Date(user.createdAt).getFullYear()}
      </p>

      <div className="stat-grid stagger" style={{ marginBottom: 14 }}>
        <div className="stat">
          <div className="value">{careerPoints.toLocaleString()}</div>
          <div className="label">Career points</div>
        </div>
        <div className="stat">
          <div className="value">{largest > 0 ? `${largest}"` : "—"}</div>
          <div className="label">Largest fish</div>
        </div>
        <div className="stat">
          <div className="value">{seaRobins}</div>
          <div className="label">Career Sea Robins</div>
        </div>
        <div className="stat">
          <div className="value">{approved.length}</div>
          <div className="label">Fish landed</div>
        </div>
        <div className="stat">
          <div className="value">{trophies}</div>
          <div className="label">Trophy fish</div>
        </div>
        <div className="stat">
          <div className="value">{recordsBroken}</div>
          <div className="label">Records broken</div>
        </div>
      </div>

      {shinerYears.length > 0 && (
        <div className="ai-verdict warn" style={{ marginBottom: 14 }}>
          🥉 Shiner Club member — {shinerYears.length} year{shinerYears.length > 1 ? "s" : ""} on
          the board with a goose egg ({shinerYears.join(", ")}). Wear it proudly.
        </div>
      )}

      <h3 style={{ fontFamily: "var(--font-head)", textTransform: "uppercase", letterSpacing: 2, color: "var(--sand-dim)", margin: "8px 0 10px" }}>
        Catch history
      </h3>
      {catches.length === 0 && (
        <div className="empty-state">
          <div className="big">🎣</div>No catches on file. Yet.
        </div>
      )}
      {catches.map((c) => (
        <CatchCard key={c.id} entry={c} />
      ))}
    </div>
  );
}
